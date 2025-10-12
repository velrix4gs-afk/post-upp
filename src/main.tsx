import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('[main.tsx] Starting PostUpp application...');

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('[main.tsx] Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error: Root element not found</h1><p>Please contact support.</p></div>';
} else {
  console.log('[main.tsx] Root element found, mounting React app...');
  try {
    createRoot(rootElement).render(<App />);
    console.log('[main.tsx] React app mounted successfully');
  } catch (error) {
    console.error('[main.tsx] Failed to mount React app:', error);
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error loading application</h1><p>' + error + '</p></div>';
  }
}
