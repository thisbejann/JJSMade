import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
    <ConvexProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1b1c25",
            color: "#f0f0f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: '"Inter", sans-serif',
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
    </MotionConfig>
  </StrictMode>
);
