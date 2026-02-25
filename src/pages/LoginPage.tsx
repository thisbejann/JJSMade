import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(password);
    if (ok) navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display font-bold text-3xl text-primary tracking-tight">
            JJSMade
          </h1>
          <p className="text-secondary text-sm mt-1">Admin access only</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border-subtle rounded-xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-secondary"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="
                  w-full px-3 py-2 rounded-lg
                  bg-elevated border border-border-default
                  text-primary placeholder:text-tertiary
                  text-sm font-body
                  outline-none
                  focus:border-accent focus:ring-1 focus:ring-accent/30
                  transition-colors
                "
              />
            </div>

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="
                mt-1 w-full py-2 px-4 rounded-lg
                bg-accent hover:bg-accent-hover
                text-base font-semibold font-body
                text-[#08080a]
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isLoading ? "Verifying…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
