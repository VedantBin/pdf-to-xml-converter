import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global styles for XML syntax highlighting
const styleElement = document.createElement("style");
styleElement.textContent = `
  .xml-content {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .xml-tag { color: #881280; }
  .xml-attr { color: #994500; }
  .xml-text { color: #1a1a1a; }
`;
document.head.appendChild(styleElement);

createRoot(document.getElementById("root")!).render(<App />);
