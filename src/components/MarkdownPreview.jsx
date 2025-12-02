// MarkdownPreview.jsx
import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

const MarkdownPreview = ({ text }) => {
  const createMarkup = () => {
    const rawHtml = marked.parse(text || "");
    return { __html: DOMPurify.sanitize(rawHtml) };
  };

  return (
    <div
      style={{
        padding: "12px",
        background: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: "8px",
        minHeight: "100px",
        fontFamily: "Arial, sans-serif",
      }}
      dangerouslySetInnerHTML={createMarkup()}
    />
  );
};

export default MarkdownPreview;
