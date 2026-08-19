import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import NavBar from "../components/Navbar";
import GifBackground from "../components/GifBackground";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validates the form, calls login() from AuthContext, then sends the user
  // back to whichever page they were trying to reach before ProtectedRoute
  // redirected them here (falls back to /home for a direct login).
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/home", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Gradient instead of a flat scrim: the GIF still reads through it, but
    // contrast stays even across the animation's light and dark frames — so
    // the type needs no text-shadow to survive.
    <GifBackground
      src="/color.gif"
      overlay="bg-gradient-to-b from-white/70 via-white/40 to-white/70"
    >
      <NavBar />
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to keep buying and selling on campus.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@qc.cuny.edu"
                className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-900 backdrop-blur-md transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-900 backdrop-blur-md transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-sm font-medium text-rose-700 backdrop-blur-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <NavLink
              to="/signup"
              className="font-semibold text-gray-900 underline-offset-4 hover:underline"
            >
              Create one
            </NavLink>
          </p>
        </div>
      </div>
    </GifBackground>
  );
}

export default Login;
