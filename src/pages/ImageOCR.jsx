import React, { useState, useCallback, useEffect } from 'react';

// Configuration for the Gemini API call
const API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
// IMPORTANT: If running this outside the Canvas environment (e.g., locally),
// replace the empty string with your actual Google AI Studio API key.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY_FOR_IMAGE_OCR; // Canvas environment provides the key if left empty

// --- UTILITY FUNCTIONS ---

// Utility function to convert a File/Blob to a Base64 string
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // We only need the base64 data part (after the comma in the data URL)
    reader.onload = () => resolve(reader.result.split(',')[1]); 
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// --- MAIN APP COMPONENT ---

const ImageOCR = () => {
  const [mode, setMode] = useState('search'); // 'search' or 'ocr'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null); // For copy notification

  // --- STATE FOR SEARCH MODE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [sources, setSources] = useState([]);

  // --- STATE FOR OCR MODE ---
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [extractedText, setExtractedText] = useState('');

  // Effect to clear copy status message after 3 seconds
  useEffect(() => {
    if (copyStatus) {
      const timer = setTimeout(() => setCopyStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  // Clean up the object URL for image preview when component unmounts or mode changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl, mode]);


  // ==========================================================
  // I. SEARCH FUNCTIONALITY (Grounded Generation)
  // ==========================================================

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResult('');
    setSources([]);

    const systemPrompt = "You are a concise, helpful research assistant. Respond to the user's query by summarizing the most important information found via Google Search. If source material is found, you MUST base your response only on that material.";
    
    const payload = {
      contents: [{ parts: [{ text: query }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${API_URL_BASE}?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 403 && API_KEY === "") {
             throw new Error(`API call failed with status: ${response.status}. If running locally, please insert your API key.`);
          }
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
          const text = candidate.content.parts[0].text;
          setSearchResult(text);

          let fetchedSources = [];
          const groundingMetadata = candidate.groundingMetadata;
          if (groundingMetadata && groundingMetadata.groundingAttributions) {
              fetchedSources = groundingMetadata.groundingAttributions
                  .map(attribution => ({
                      uri: attribution.web?.uri,
                      title: attribution.web?.title,
                  }))
                  .filter(source => source.uri && source.title);
          }
          setSources(fetchedSources);

          break; 
        } else {
            setSearchResult("No meaningful response generated. Try a different query.");
            break;
        }
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("Gemini API Error:", err);
          setError(`Failed to perform search after ${maxAttempts} attempts. Error: ${err.message || 'Unknown network error.'}`);
        } else {
          const delay = Math.pow(2, attempts) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (mode === 'search') {
      performSearch(searchQuery);
    }
  };

  // ==========================================================
  // II. OCR FUNCTIONALITY (Image Understanding)
  // ==========================================================

  const copyToClipboard = (text) => {
    // Replaced alert() with state-based notification
    navigator.clipboard.writeText(text)
        .then(() => setCopyStatus('Text copied successfully!'))
        .catch(err => {
            setCopyStatus('Failed to copy text.');
            console.error("Failed to copy: ", err);
        });
  };

  // Function to call the Gemini API for OCR
  const analyzeImage = useCallback(async (base64Image, mimeType) => {
    setLoading(true);
    setError(null);
    setExtractedText('');

    const systemPrompt = "You are an Optical Character Recognition (OCR) expert. Your task is to accurately extract all legible text from the provided image. Respond only with the extracted text, formatted exactly as it appears in the image, preserving line breaks and spacing where possible. Do not add any introductory phrases, explanations, or analysis.";
    const userQuery = "Extract the text from this image.";

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userQuery },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${API_URL_BASE}?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
           if (response.status === 403 && API_KEY === "") {
             throw new Error(`API call failed with status: ${response.status}. If running locally, please insert your API key.`);
          }
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not extract text.';
        setExtractedText(text);
        break; // Success, exit loop
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("Gemini API Error:", err);
          setError(`Failed to process image after ${maxAttempts} attempts. Error: ${err.message || 'Unknown network error.'}`);
        } else {
          const delay = Math.pow(2, attempts) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Handler for the paste event
  const handlePaste = useCallback(async (event) => {
    if (mode !== 'ocr') return;

    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let imageItem = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageItem = items[i];
        break;
      }
    }

    if (imageItem) {
      event.preventDefault(); // Prevent default text paste behavior
      const file = imageItem.getAsFile();
      if (!file) {
        setError("Could not read image file from clipboard.");
        return;
      }

      // 1. Create temporary URL for local preview
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(URL.createObjectURL(file));
      setExtractedText(''); // Clear previous text

      // 2. Convert to Base64 for API call
      try {
        const base64Image = await fileToBase64(file);
        // 3. Call the OCR analysis
        await analyzeImage(base64Image, file.type);
      } catch (err) {
        console.error("Error during file conversion or API call:", err);
        setError("An error occurred during image processing.");
        setLoading(false);
      }
    }
  }, [analyzeImage, imagePreviewUrl, mode]);

  // ==========================================================
  // III. RENDER LOGIC
  // ==========================================================

  const renderSearchMode = () => (
    <>
      <h1 className="text-3xl font-bold text-center text-green-700 mb-2">
        Grounded Web Search
      </h1>
      <p className="text-center text-gray-500 mb-8">
        Ask a question, and the Gemini API will use Google Search to find and summarize the answer.
      </p>

      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="E.g., What are the latest findings on exoplanets?"
          className="flex-grow p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition duration-150 shadow-sm"
          disabled={loading}
        />
        <button
          type="submit"
          className={`p-3 rounded-lg text-white font-semibold transition duration-150 ease-in-out ${
            loading 
              ? 'bg-green-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg'
          }`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Searching...
            </div>
          ) : (
            'Search & Summarize'
          )}
        </button>
      </form>

      {/* Results Area */}
      <div className="bg-gray-100 p-6 rounded-xl shadow-inner min-h-[150px]">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
          Search Result Summary
        </h2>
        {searchResult ? (
          <div className="text-gray-800 leading-relaxed">
            <p className="whitespace-pre-wrap">{searchResult}</p>
            
            {/* Sources/Citations */}
            {sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-300">
                <p className="font-semibold text-sm text-gray-600 mb-2">Sources:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-500">
                  {sources.map((source, index) => (
                    <li key={index}>
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-words"
                        title={source.uri}
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 italic">
            Results will appear here after you perform a search.
          </p>
        )}
      </div>
    </>
  );

  const renderOcrMode = () => (
    <>
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
        Clipboard Image OCR
      </h1>
      <p className="text-center text-gray-500 mb-8">
        Paste an image (Ctrl+V or Cmd+V) into the box below to extract text using the Gemini API.
      </p>

      {/* Image Paste Input Area */}
      <div
        onPaste={handlePaste}
        tabIndex={0}
        className="relative w-full h-40 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center
                   text-gray-400 text-lg hover:border-blue-400 transition duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
      >
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-blue-600">Processing image...</p>
          </div>
        ) : imagePreviewUrl ? (
          <div className="p-2 text-green-600">
            Image detected! Analyzing text...
          </div>
        ) : (
          'Click here, then press Ctrl+V (Cmd+V) to paste an image.'
        )}
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-8">
        {/* Image Preview Area */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner min-h-[200px]">
          <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">
            Image Preview
          </h2>
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Pasted content preview"
              className="max-w-full h-auto rounded-md shadow-md mx-auto"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          ) : (
            <p className="text-gray-400 italic">No image pasted yet.</p>
          )}
        </div>

        {/* Extracted Text Area */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner min-h-[200px]">
          <div className="flex flex-row items-center justify-between mb-3 border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Extracted Text
            </h2>
            <button 
              disabled={!extractedText} 
              className={`px-3 py-1 text-white rounded-md transition duration-150 ${
                extractedText 
                  ? 'bg-blue-500 hover:bg-blue-600 shadow-md' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={() => extractedText && copyToClipboard(extractedText)}
            >
              Copy Text
            </button>
          </div>
          {loading && !extractedText ? (
            <p className="text-gray-400 italic">...waiting for text...</p>
          ) : extractedText ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded border border-gray-200 text-gray-800">
              {extractedText}
            </pre>
          ) : (
            <p className="text-gray-400 italic">Pasted text will appear here.</p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-6 md:p-10">

        {/* Mode Selector Tabs */}
        <div className="flex justify-center mb-8 border-b border-gray-200">
          <button
            onClick={() => setMode('search')}
            className={`py-3 px-6 text-lg font-semibold transition duration-200 ${
              mode === 'search'
                ? 'border-b-4 border-green-600 text-green-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Web Search
          </button>
          <button
            onClick={() => setMode('ocr')}
            className={`py-3 px-6 text-lg font-semibold transition duration-200 ${
              mode === 'ocr'
                ? 'border-b-4 border-blue-600 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Image OCR
          </button>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6" role="alert">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Copy Status Notification */}
        {copyStatus && (
          <div className={`mt-4 p-3 rounded-lg mb-6 text-center ${
            copyStatus.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`} role="status">
            {copyStatus}
          </div>
        )}

        {/* Render content based on mode */}
        {mode === 'search' ? renderSearchMode() : renderOcrMode()}
        
      </div>
    </div>
  );
};

export default ImageOCR;


























































































// import React, { useState, useEffect, useCallback } from 'react';
// // Firestore and Firebase imports are not needed for this API-only task.

// // Configuration for the Gemini API call
// const API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
// const API_KEY = import.meta.env.VITE_GEMINI_API_KEY_FOR_IMAGE_OCR; // Canvas environment provides the key if left empty

// // Utility function to convert a File/Blob to a Base64 string
// const fileToBase64 = (file) => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result.split(',')[1]); // Only the base64 data part
//     reader.onerror = (error) => reject(error);
//     reader.readAsDataURL(file);
//   });
// };

// const ImageOCR = () => {
//   const [loading, setLoading] = useState(false);
//   const [extractedText, setExtractedText] = useState('');
//   const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
//   const [error, setError] = useState(null);

//   // Function to call the Gemini API for OCR
//   const analyzeImage = useCallback(async (base64Image, mimeType) => {
//     setLoading(true);
//     setError(null);
//     setExtractedText('');

//     const systemPrompt = "You are an Optical Character Recognition (OCR) expert. Your task is to accurately extract all legible text from the provided image. Respond only with the extracted text, formatted exactly as it appears in the image, preserving line breaks and spacing where possible. Do not add any introductory phrases, explanations, or analysis.";
//     const userQuery = "Extract the text from this image.";

//     const payload = {
//       contents: [
//         {
//           role: "user",
//           parts: [
//             { text: userQuery },
//             {
//               inlineData: {
//                 mimeType: mimeType,
//                 data: base64Image
//               }
//             }
//           ]
//         }
//       ],
//       systemInstruction: {
//           parts: [{ text: systemPrompt }]
//       },
//     };

//     let attempts = 0;
//     const maxAttempts = 5;

//     while (attempts < maxAttempts) {
//       try {
//         const response = await fetch(`${API_URL_BASE}?key=${API_KEY}`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload)
//         });

//         if (!response.ok) {
//           throw new Error(`API call failed with status: ${response.status}`);
//         }

//         const result = await response.json();
//         const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not extract text.';
//         setExtractedText(text);
//         break; // Success, exit loop
//       } catch (err) {
//         attempts++;
//         if (attempts >= maxAttempts) {
//           console.error("Gemini API Error:", err);
//           setError(`Failed to process image after ${maxAttempts} attempts. Please check the console for details.`);
//         } else {
//           const delay = Math.pow(2, attempts) * 1000; // Exponential backoff: 2s, 4s, 8s, ...
//           console.log(`Attempt ${attempts} failed. Retrying in ${delay / 1000}s...`);
//           await new Promise(resolve => setTimeout(resolve, delay));
//         }
//       } finally {
//         if (attempts >= maxAttempts || extractedText) {
//              setLoading(false);
//         }
//       }
//     }
//     setLoading(false);
//   }, []);

//   // Handler for the paste event
//   const handlePaste = useCallback(async (event) => {
//     const items = (event.clipboardData || event.originalEvent.clipboardData).items;
//     let imageItem = null;

//     for (let i = 0; i < items.length; i++) {
//       if (items[i].type.indexOf('image') !== -1) {
//         imageItem = items[i];
//         break;
//       }
//     }

//     if (imageItem) {
//       event.preventDefault(); // Prevent default text paste behavior
//       const file = imageItem.getAsFile();
//       if (!file) {
//         setError("Could not read image file from clipboard.");
//         return;
//       }

//       // 1. Create temporary URL for local preview
//       if (imagePreviewUrl) {
//         URL.revokeObjectURL(imagePreviewUrl);
//       }
//       setImagePreviewUrl(URL.createObjectURL(file));

//       // 2. Convert to Base64 for API call
//       try {
//         const base64Image = await fileToBase64(file);
//         // 3. Call the OCR analysis
//         await analyzeImage(base64Image, file.type);
//       } catch (err) {
//         console.error("Error during file conversion or API call:", err);
//         setError("An error occurred during image processing.");
//         setLoading(false);
//       }
//     }
//   }, [analyzeImage, imagePreviewUrl]);

//   // Clean up the object URL when the component unmounts or image changes
//   useEffect(() => {
//     return () => {
//       if (imagePreviewUrl) {
//         URL.revokeObjectURL(imagePreviewUrl);
//       }
//     };
//   }, [imagePreviewUrl]);

//   function copyToClipboard(text) {
//     navigator.clipboard.writeText(text)
//         .then(() => {
//             alert("Copied to clipboard!");
//         })
//         .catch(err => {
//             alert("Failed to copy ");
//             console.error("Failed to copy: ", err);
//         });
//     }

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8 font-sans">
//       <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-6 md:p-10">
//         <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
//           Clipboard Image OCR
//         </h1>
//         <p className="text-center text-gray-500 mb-8">
//           Paste an image (Ctrl+V or Cmd+V) into the box below to extract text using the Gemini API.
//         </p>

//         {/* Image Paste Input Area */}
//         <div
//           onPaste={handlePaste}
//           tabIndex={0}
//           className="relative w-full h-40 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center
//                      text-gray-400 text-lg hover:border-blue-400 transition duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
//         >
//           {loading ? (
//             <div className="flex flex-col items-center">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               <p className="mt-2 text-blue-600">Processing image...</p>
//             </div>
//           ) : imagePreviewUrl ? (
//             <div className="p-2 text-green-600">
//               Image detected! Analyzing text...
//             </div>
//           ) : (
//             'Click here, then press Ctrl+V (Cmd+V) to paste an image.'
//           )}
//         </div>

//         {/* Error Display */}
//         {error && (
//           <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
//             <p className="font-semibold">Error:</p>
//             <p>{error}</p>
//           </div>
//         )}

//         <div className="mt-8 grid md:grid-cols-2 gap-8">
//           {/* Image Preview Area */}
//           <div className="bg-gray-100 p-4 rounded-lg shadow-inner min-h-[200px]">
//             <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">
//               Image Preview
//             </h2>
//             {imagePreviewUrl ? (
//               <img
//                 src={imagePreviewUrl}
//                 alt="Pasted content preview"
//                 className="max-w-full h-auto rounded-md shadow-md mx-auto"
//                 style={{ maxHeight: '400px', objectFit: 'contain' }}
//               />
//             ) : (
//               <p className="text-gray-400 italic">No image pasted yet.</p>
//             )}
//           </div>

//           {/* Extracted Text Area */}
//           <div className="bg-gray-100 p-4 rounded-lg shadow-inner min-h-[200px]">
//             <div className="flex flex-row items-center justify-between mb-3 border-b pb-2">
//                 <h2 className="text-xl font-semibold text-gray-700 ">
//                 Extracted Text
//                 </h2>
//                 <button disabled={!extractedText} className="px-2 bg-blue-400 py-1 rounded-md hover:cursor-pointer hover:bg-blue-500 " onClick={()=>{copyToClipboard(extractedText && extractedText)}} >Copy Text</button>
//             </div>
//             {loading && !extractedText ? (
//                 <p className="text-gray-400 italic">...waiting for text...</p>
//             ) : extractedText ? (
//               <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded border border-gray-200 text-gray-800">
//                 {extractedText}
//               </pre>
//             ) : (
//               <p className="text-gray-400 italic">Pasted text will appear here.</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ImageOCR;