// Full-bleed animated background for a page section.
//
// Renders the GIF as an absolutely-positioned layer and its children above it.
// The parent it's dropped into must be `relative` — or just use this as the
// outermost wrapper, which is what it does by default.
//
// A note on sharpness: the source GIFs are ~480px wide and get stretched
// across a full viewport, so they can't be crisp — there simply aren't enough
// pixels. Rather than let that read as a low-quality image, the layers below
// commit to softness: overscan and drift give it motion, a slight blur hides
// the upscaling, and grain breaks up the colour banding GIF's 256-colour
// palette produces on smooth gradients.
function GifBackground({
  src,
  children,
  className = "",
  overlay = "bg-white/80",
  // Escape hatches — a genuinely high-resolution source wants none of this.
  soften = true,
  animate = true,
  vignette = true,
  grain = true,
}) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Transform on the wrapper, filter on the image. A filtered element
          rasterises to its own texture, so animating an ancestor slides that
          texture around instead of re-blurring a full-screen image every
          frame — the same two classes on one element would do exactly that.
          The overscan keeps the blurred edge off the viewport. */}
      <div
        className={`absolute inset-0 ${
          animate ? "motion-safe:animate-drift scale-110" : "scale-105"
        }`}
      >
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={`h-full w-full object-cover ${soften ? "blur-[2px]" : ""}`}
        />
      </div>

      {overlay !== "none" && <div className={`absolute inset-0 ${overlay}`} />}

      {/* Clear in the middle, falling away at the edges. Content then sits
          inside the image rather than under a sheet of flat fog. */}
      {vignette && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(255_255_255_/_0.5)_100%)]" />
      )}

      {grain && <div className="bg-grain pointer-events-none absolute inset-0" />}

      {/* `relative` lifts the content above every layer without a z-index. */}
      <div className="relative">{children}</div>
    </div>
  );
}

export default GifBackground;
