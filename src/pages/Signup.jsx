import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import NavBar from "../components/Navbar";
import GifBackground from "../components/GifBackground";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side validation (all fields present, 8+ char password) before
  // calling signup() from AuthContext, which creates the account and logs
  // the user in immediately. Always lands on /home — there's no "came from"
  // page to return to for a brand-new signup.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({ name, email, password });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GifBackground
      src="/color.mp4"
      overlay="bg-gradient-to-b from-white/70 via-white/40 to-white/70"
    >
      <NavBar />
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Buy and sell with students on your campus.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-900 backdrop-blur-md transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

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
                placeholder="@qc.cuny.edu"
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
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
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <NavLink
              to="/login"
              className="font-semibold text-gray-900 underline-offset-4 hover:underline"
            >
              Log in
            </NavLink>
          </p>
        </div>
      </div>
    </GifBackground>
  );
}

export default Signup;
