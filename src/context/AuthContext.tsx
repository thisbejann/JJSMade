import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

const STORAGE_KEY = "jjs_auth";

interface AuthContextValue {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = useAction(api.auth.validatePassword);

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await validatePassword({ password });
        if (result.valid) {
          localStorage.setItem(STORAGE_KEY, "true");
          setIsLoggedIn(true);
          return true;
        } else {
          setError("Incorrect password. Please try again.");
          return false;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [validatePassword]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
