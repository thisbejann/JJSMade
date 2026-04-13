import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
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
      <Toaster position="bottom-right" richColors />
    </ConvexProvider>
    </MotionConfig>
  </StrictMode>
);
