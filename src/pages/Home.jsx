import NavBar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what students are selling right now.
        </p>

        <div className="mt-6 flex gap-3">
          <input
            type="search"
            placeholder="Search textbooks, furniture, electronics..."
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400"
          />
          <button className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
            Post an item
          </button>
        </div>

        {/* Placeholder cards until GET /api/listings exists */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="aspect-[4/3] bg-gray-100" />
              <div className="p-4">
                <div className="h-4 w-3/4 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
                <div className="mt-3 h-3 w-1/2 rounded bg-gray-50" />
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Home;
