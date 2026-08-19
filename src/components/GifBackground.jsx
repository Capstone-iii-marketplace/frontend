// Full-bleed animated background for a page section.
//
// Renders the GIF as an absolutely-positioned layer and its children above it.
// The parent it's dropped into must be `relative` — or just use this as the
// outermost wrapper, which is what it does by default.
//
// `overlay` is how much white haze sits between the GIF and the content:
// "none" for a marketing page where the animation is the point, a value like
// "bg-white/80" anywhere text has to stay readable over it.
function GifBackground({
  src,
  children,
  className = "",
  overlay = "bg-white/80",
}) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {overlay !== "none" && (
        <div className={`absolute inset-0 ${overlay}`} />
      )}
      {/* `relative` lifts the content above both layers without a z-index. */}
      <div className="relative">{children}</div>
    </div>
  );
}

export default GifBackground;
