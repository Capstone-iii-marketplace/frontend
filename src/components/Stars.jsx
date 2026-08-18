import { Star } from "lucide-react";

// Display when no onChange is passed, input when there is one.
export default function Stars({ value = 0, onChange, size = 16 }) {
  const readOnly = !onChange;

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          onClick={readOnly ? undefined : () => onChange(n)}
          aria-label={readOnly ? undefined : `${n} star${n > 1 ? "s" : ""}`}
          className={`${
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          } ${readOnly ? "" : "cursor-pointer"}`}
        />
      ))}
    </span>
  );
}
