import { Link } from "react-router-dom";
import { PenLine, ArrowRight } from "lucide-react";
import GifBackground from "../components/GifBackground";
import NavBar from "../components/Navbar";

// Public landing page at "/". Fully static — no state, no API calls.
// The marketing front door: brand header, full-bleed hero, and CTAs.
function Welcome() {
  return (
    // A dark gradient ground means the type stays readable whichever GIF is
    // dropped in — light frames, dark frames, or a swap for a different file.
    <GifBackground
      src="/sea.mp4"
      overlay="bg-gradient-to-b from-white/70 via-white/40 to-white/70"
    >
      <NavBar />

      {/* Full-bleed: no max-width, no rounding, no padding on the section
          itself — it spans the whole viewport and fills the height left over
          below the header. */}
      <section className="flex min-h-[calc(100dvh-3.5rem)] items-center">
        {/* No scrim — the GIF shows at full strength. The text stays legible
            via a white halo instead, so nothing washes the animation out. */}
        <div className="relative mx-auto w-full max-w-6xl px-6 text-center">
          {/* Eyebrow — sets context before the headline lands. */}
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-gray-700 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Built for CUNY students
          </span>

          <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl">
            Buy and sell with students on your campus
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            Textbooks, furniture, electronics — everything students actually
            need, from people you can meet in person.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {/* Solid fills, so the buttons stay readable over any frame. */}
            <Link
              to="/signup"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:w-auto"
            >
              Get started
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white/70 px-7 py-3.5 text-sm font-semibold text-gray-800 backdrop-blur-sm transition hover:bg-white sm:w-auto"
            >
              I have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200/60 bg-white/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
          <span className="font-display flex items-center gap-1.5 text-sm font-bold text-gray-900">
            Sell Me A Pen
            <PenLine
              size={14}
              strokeWidth={2.25}
              className="text-emerald-600"
            />
          </span>
          <p className="text-xs text-gray-500">
            A CUNY Capstone III project · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </GifBackground>
  );
}

export default Welcome;
