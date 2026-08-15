import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";

// Public landing page at "/". Fully static — no state, no API calls.
// The marketing front door: brand header, hero headline, and CTAs.
function Welcome() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display flex items-center gap-1.5 text-lg font-bold text-gray-900">
            Sell Me A Pen
            <PenLine size={18} strokeWidth={2.25} className="text-emerald-600" />
          </span>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 text-center">
          <h1 className="font-display mx-auto max-w-2xl text-5xl font-bold leading-tight text-gray-900">
            Buy and sell with students on your campus
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
            Textbooks, furniture, electronics — everything students actually
            need, from people you can meet in person.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              I have an account
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Welcome;
