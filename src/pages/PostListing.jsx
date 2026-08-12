import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/Navbar";
import { marketplaceApi } from "../api/client";

const PAYMENT_OPTIONS = [
  { value: "both", label: "Online or in-person" },
  { value: "online", label: "Online payment only" },
  { value: "in_person", label: "In-person only" },
];

const MAX_PHOTOS = 6;

// Downscales and re-encodes the picked file in the browser so the resulting
// data URL stays a reasonable size — these get stored as plain strings, no
// upload endpoint involved.
function fileToDataUrl(file, maxDimension = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a valid image"));
      img.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width, img.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function PostListing() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("both");
  const [photos, setPhotos] = useState([]); // [{ id, dataUrl }]
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;
    marketplaceApi
      .listing(id)
      .then(({ listing }) => {
        if (cancelled) return;
        setTitle(listing.title || "");
        setDescription(listing.description || "");
        setPrice(
          typeof listing.priceCents === "number"
            ? String(listing.priceCents / 100)
            : "",
        );
        setPaymentMethods(listing.paymentMethods || "both");
        setPhotos(
          (listing.images || []).map((dataUrl, i) => ({
            id: `existing-${i}`,
            dataUrl,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load that listing.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;

    setIsProcessingPhotos(true);
    setError("");
    try {
      const converted = await Promise.all(
        files.slice(0, room).map(async (file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          dataUrl: await fileToDataUrl(file),
        })),
      );
      setPhotos((prev) => [...prev, ...converted]);
    } catch (err) {
      setError(err.message || "Couldn't process one of those photos.");
    } finally {
      setIsProcessingPhotos(false);
    }
  }

  function handleFileInputChange(e) {
    handleFiles(e.target.files);
    e.target.value = ""; // allow picking the same file again later
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Give your item a title.");
      return;
    }
    const priceNumber = Number(price);
    if (!price || Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Enter a valid price.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priceCents: Math.round(priceNumber * 100),
        paymentMethods,
        images: photos.map((p) => p.dataUrl),
      };
      const data = isEditing
        ? await marketplaceApi.updateListing(id, payload)
        : await marketplaceApi.createListing(payload);
      navigate(`/listings/${data.listing.id}`);
    } catch (err) {
      setError(
        err.message ||
          `Couldn't ${isEditing ? "update" : "post"} this listing. Try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          {isEditing ? "Edit listing" : "Post an item"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing
            ? "Update the details below."
            : "Fill in the details below — it'll show up in the marketplace right away."}
        </p>

        {isLoading ? (
          <p className="mt-10 text-center text-sm text-gray-500">Loading...</p>
        ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-white p-6"
        >
          <div>
            <label
              htmlFor="title"
              className="text-sm font-medium text-gray-900"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Calculus: Early Transcendentals, 8th ed."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-900"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition, why you're selling, anything a buyer should know..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price"
                className="text-sm font-medium text-gray-900"
              >
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45.00"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="paymentMethods"
                className="text-sm font-medium text-gray-900"
              >
                Payment
              </label>
              <select
                id="paymentMethods"
                value={paymentMethods}
                onChange={(e) => setPaymentMethods(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
              >
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-900">Photos</span>

            <div className="mt-2 flex flex-wrap gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative h-20 w-20">
                  <img
                    src={photo.dataUrl}
                    alt=""
                    className="h-full w-full rounded-lg border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label="Remove photo"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs text-white shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  disabled={isProcessingPhotos}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <span className="text-xl leading-none">+</span>
                  <span className="text-[10px] leading-tight">
                    {isProcessingPhotos ? "Adding..." : "Upload"}
                  </span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            <p className="mt-2 text-xs text-gray-400">
              Choose photos from your computer — up to {MAX_PHOTOS}. The first
              one becomes the thumbnail.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isProcessingPhotos}
            className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Posting..."
              : isEditing
                ? "Save changes"
                : "Post listing"}
          </button>
        </form>
        )}
      </main>
    </div>
  );
}

export default PostListing;
