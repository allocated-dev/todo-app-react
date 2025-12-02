import React, { useState, useCallback, useEffect } from 'react';
import '../style/ImageOCR.css'
import MarkdownPreview from '../components/MarkdownPreview';

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
  // We are removing the 'search' mode logic and making it a unified Image Search component
  // The mode will be implicitly 'image-search' now, but we keep the structure for now, setting default to 'ocr' (which we will adapt)
  const [mode, setMode] = useState('ocr'); // Setting default to 'ocr' for image-focused app
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null); // For copy notification

  // --- STATE FOR IMAGE/SEARCH RESULT ---
  // Use the 'searchResult' and 'sources' state for the final output
  const [searchResult, setSearchResult] = useState('');
  const [sources, setSources] = useState([]);
  // Keep these two for the image processing intermediate step and display
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [extractedText, setExtractedText] = useState(''); // Stores the text extracted from the image


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

  // Updated to accept a query directly for use after OCR
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setError("Extracted text is empty. Cannot perform search.");
      return;
    }

    // Do not set loading/clearing here, it's done in the combined function
    // Only set result/source here
    setSearchResult('');
    setSources([]);

    // Modified prompt for general search based on extracted text
    const systemPrompt = "You are a helpful assistant. Answer only in the format: '## Option #: **text is correct** ##' based on Google Search results. Place the correct option text in **this type** of bold formatting and in start of response.";

    const payload = {
      contents: [{ parts: [{ text: `Based on the following extracted text, provide a grounded summary: "${query}"` }] }],
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

          return true; // Success
        } else {
            setSearchResult("No meaningful response generated. Try a different image.");
            return false;
        }
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("Gemini API Error:", err);
          setError(`Failed to perform search after ${maxAttempts} attempts. Error: ${err.message || 'Unknown network error.'}`);
          return false;
        } else {
          const delay = Math.pow(2, attempts) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    return false; // Should not be reached but for safety
  }, []);


  // ==========================================================
  // II. OCR FUNCTIONALITY (Image Understanding)
  // ==========================================================

  // Function to call the Gemini API for OCR
  const analyzeImage = useCallback(async (base64Image, mimeType) => {
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
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''; // Return empty string on failure
        setExtractedText(text);
        return text; // Success, return the extracted text
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("Gemini API Error (OCR):", err);
          setError(`Failed to process image for text extraction after ${maxAttempts} attempts. Error: ${err.message || 'Unknown network error.'}`);
          return null; // Indicate failure
        } else {
          const delay = Math.pow(2, attempts) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    return null; // Should not be reached
  }, []);


  // ==========================================================
  // III. COMBINED OCR & SEARCH FUNCTIONALITY (The main change)
  // ==========================================================

  const analyzeImageAndSearch = useCallback(async (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setExtractedText('');
    setSearchResult('');
    setSources([]);

    try {
      // 1. Convert to Base64 for API call
      const base64Image = await fileToBase64(file);

      // 2. Call the OCR analysis
      const extractedText = await analyzeImage(base64Image, file.type);
      if (!extractedText || extractedText === 'Could not extract text.') {
        setError("Could not extract meaningful text from the image. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Search into the AI (Grounded Search)
      // The search function handles its own retries and updates 'searchResult' and 'sources'
      const searchSuccess = await performSearch(extractedText);

      if (!searchSuccess) {
        setError("Image text was extracted, but the subsequent web search failed.");
      }


    } catch (err) {
      console.error("Error during image-search chain:", err);
      setError(`An error occurred during the overall process: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [analyzeImage, performSearch]);


  // Handler for the paste event
  const handlePaste = useCallback(async (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let imageItem = null;

    for (let i =  0; i < items.length; i++) {
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

      // 2. Perform the combined OCR and Search
      analyzeImageAndSearch(file);

    } else {
      // Optional: Handle if the user pastes text instead of an image
      console.log("No image found in clipboard.");
    }
  }, [imagePreviewUrl, analyzeImageAndSearch]);

  const copyExtractedTextToClipboard = () => {
    // Replaced alert() with state-based notification
    navigator.clipboard.writeText(extractedText)
        .then(() => setCopyStatus('Extracted text copied successfully!'))
        .catch(err => {
            setCopyStatus('Failed to copy text.');
            console.error("Failed to copy: ", err);
        });
  };


  // ==========================================================
  // IV. RENDER LOGIC - Consolidated into a single mode view
  // ==========================================================

  const renderImageSearchMode = () => (
    <>
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
        Image-to-Search (OCR + Grounded AI)
      </h1>
      <p className="text-center text-gray-500 mb-8">
        <b>Paste an image (Ctrl+V or Cmd+V)</b> into the box. The app will extract the text, and then use that text to perform a web search via the Gemini API.
      </p>

      {/* Image Paste Input Area */}
      <div
        onPaste={handlePaste}
        tabIndex={0}
        className="relative w-full h-40 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center
                   text-gray-400 text-lg hover:border-indigo-400 transition duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
      >
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-indigo-600">
              {extractedText ? 'Searching based on extracted text...' : 'Extracting text from image...'}
            </p>
          </div>
        ) : imagePreviewUrl && !searchResult ? (
          <div className="p-2 text-green-600">
            Image pasted! Ready to process.
          </div>
        ) : (
          'Click here, then press Ctrl+V (Cmd+V) to paste an image for search.'
        )}
      </div>

      {/* Main Output Area: Search Result */}
      <div className="mt-8 bg-gray-100 p-6 rounded-xl shadow-inner min-h-[150px]">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
          AI Search Result (Based on Image Text)
        </h2>
        {searchResult ? (
          <div className="text-gray-800 leading-relaxed">
            <MarkdownPreview text={searchResult} />

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
            Search result and summary will appear here.
          </p>
        )}
      </div>

      {/* Secondary Area: Extracted Text and Image Preview */}
      <div className="mt-8 grid md:grid-cols-2 gap-8">

        {/* Extracted Text Area */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner min-h-[200px] ">
          <div className="flex flex-row items-center justify-between mb-3 border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Extracted Text (The Search Query)
            </h2>
            <button
              disabled={!extractedText}
              className={`px-3 py-1 text-white rounded-md text-sm transition duration-150 ${
                extractedText
                  ? 'bg-indigo-500 hover:bg-indigo-600 shadow-md'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={copyExtractedTextToClipboard}
            >
              Copy Text
            </button>
          </div>
          {loading && !extractedText ? (
            <p className="text-gray-400 italic">...waiting for text extraction...</p>
          ) : extractedText ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded border border-gray-200 text-gray-800 h-full">
              {extractedText}
            </pre>
          ) : (
            <p className="text-gray-400 italic">Extracted text will appear here and be used for the search query.</p>
          )}
        </div>

        {/* Image Preview Area */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner min-h-[400px]">
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
            <p className="text-gray-400 italic">No image pasted yet. Paste an image to begin.</p>
          )}
        </div>
      </div>

    </>
  );


  return (
    <div className="min-h-screen max-h-[100%] bg-gray-50 flex flex-col items-center p-4 sm:p-8 font-sans ">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-6 md:p-10 h-[100%]">

        {/* The Mode Selector Tabs are removed to create a unified view */}
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

        {/* Render the new combined content */}
        {renderImageSearchMode()}

      </div>
    </div>
  );
};

export default ImageOCR;