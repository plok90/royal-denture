import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

// Analytics loads after first paint (doesn't block LCP)
requestAnimationFrame(() => {
  setTimeout(() => { initAnalytics().catch(() => {}); }, 500);
});

createRoot(document.getElementById("root")!).render(<App />);
