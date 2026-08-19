// Full-bleed animated background for a page section.
//
// Renders the animation as an absolutely-positioned layer and its children
// above it. The parent it's dropped into must be `relative` — or just use this
// as the outermost wrapper, which is what it does by default.
//
// `src` takes either a video or a GIF and picks the right element. Video is
// worth preferring: GIF caps at 256 colours, which bands badly across the
// smooth gradients these backgrounds use, and the same footage encodes far
// smaller as H.264.
//
// A note on sharpness: the original sources are ~480px wide and get stretched
// across a full viewport, so they can't be crisp — there aren't enough pixels.
// Rather than let that read as a low-quality image, the layers below commit to
// softness: overscan and drift give it motion, a slight blur hides the
// upscaling, and grain breaks up any remaining banding.
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
  const isVideo = /\.(mp4|webm|mov)$/i.test(src);
  const mediaClass = `h-full w-full object-cover ${soften ? "blur-[2px]" : ""}`;

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Transform on the wrapper, filter on the media. A filtered element
          rasterises to its own texture, so animating an ancestor slides that
          texture around instead of re-blurring a full-screen image every
          frame — the same two classes on one element would do exactly that.
          The overscan keeps the blurred edge off the viewport. */}
      <div
        className={`absolute inset-0 ${
          animate ? "motion-safe:animate-drift scale-110" : "scale-105"
        }`}
      >
        {isVideo ? (
          // playsInline matters: without it iOS Safari refuses to autoplay
          // inline and throws the video fullscreen instead. muted is what
          // makes autoplay permissible at all.
          <video
            src={src}
            className={mediaClass}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : (
          <img src={src} alt="" aria-hidden="true" className={mediaClass} />
        )}
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
