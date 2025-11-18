import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandler, setupNetworkStatusHandler } from './lib/globalErrorHandler';
import { registerServiceWorker } from './lib/serviceWorkerRegistration';

setupGlobalErrorHandler();
setupNetworkStatusHandler();

if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}

createRoot(document.getElementById("root")!).render(<App />);
