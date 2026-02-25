import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a1f",
            color: "#f0f0f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: '"General Sans", sans-serif',
          },
          success: {
            style: { borderLeft: "3px solid #22c55e" },
          },
          error: {
            style: { borderLeft: "3px solid #ef4444" },
          },
        }}
      />
    </ConvexProvider>
  </StrictMode>
);
