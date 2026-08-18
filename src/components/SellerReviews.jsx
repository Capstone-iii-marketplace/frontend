import { useEffect, useState } from "react";
import { reviewsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Stars from "./Stars";
import { Pencil, Trash2 } from "lucide-react";

export default function SellerReviews({ sellerId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average: null, count: 0 });
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const load = () =>
    reviewsApi
      .forSeller(sellerId)
      .then((d) => {
        setReviews(d.reviews);
        setSummary(d.summary);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (sellerId) load();
  }, [sellerId]);

  const isOwnProfile = user?.id === sellerId;
  const alreadyReviewed = reviews.some((r) => r.author.id === user?.id);

  const startEdit = (review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setBody(review.body || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRating(0);
    setBody("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await reviewsApi.update(editingId, { rating, body });
      } else {
        await reviewsApi.create({ sellerId, rating, body });
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      await reviewsApi.remove(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Reviews</h3>
        {summary.count > 0 ? (
          <>
            <Stars value={summary.average} size={14} />
            <span className="text-xs text-gray-500">
              {summary.average} ({summary.count})
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400">No reviews yet</span>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      {!isOwnProfile && (!alreadyReviewed || editingId) && (
        <form onSubmit={submit} className="mt-3 border-t border-gray-100 pt-3">
          <Stars value={rating} onChange={setRating} size={20} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="How was the exchange? (optional)"
            className="mt-2 w-full rounded-lg border border-gray-300 p-2 text-sm"
            rows={2}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={rating === 0}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {editingId ? "Save changes" : "Post review"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <ul className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <div className="flex items-center gap-2">
                <Stars value={r.rating} size={12} />
                <span className="text-xs font-medium text-gray-900">
                  {r.author.name}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
                {r.author.id === user?.id && (
                  <span className="ml-auto flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      aria-label="Edit review"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      aria-label="Delete review"
                      className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                )}
              </div>
              {r.body && <p className="mt-1 text-sm text-gray-600">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
