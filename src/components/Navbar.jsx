import { Link, NavLink, useNavigate } from "react-router-dom";
import { PenLine } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Top navigation bar, rendered once by AppLayout for every authenticated
// page. Adapts its links based on auth state (Dashboard/Cart/Logout vs.
// Login/Sign Up).
function NavBar({ dark = false }) {
  const { isAuthenticated, logout, user } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  // Logs the user out, then sends them back to the landing page.
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav
      className={`sticky top-0 z-20 w-full border-b p-4 backdrop-blur-md ${
        // Light pages (dashboard, listings) keep the default; the GIF-backed
        // auth pages pass dark so the bar doesn't read as a foreign slab.
        dark
          ? "border-white/10 bg-gray-950/30 text-white"
          : "border-white/20 bg-base-200/60"
      }`}
    >
      <div className="container mx-auto flex items-center gap-4">
        <Link
          to="/home"
          className="font-display flex items-center gap-1.5 text-lg font-bold"
        >
          Sell Me A Pen
          <PenLine size={18} strokeWidth={2.25} className="text-emerald-600" />
        </Link>

        <div className="flex-1" />
        {isAuthenticated ? (
          <>
            <NavLink to="/home" className="font-bold">
              Dashboard
            </NavLink>
            <NavLink to="/my-listings" className="btn btn-ghost">
              My Listings
            </NavLink>
            <NavLink to="/messages" className="btn btn-ghost">
              Messages
            </NavLink>
            <NavLink to="/checkout" className="btn btn-ghost">
              Cart{count > 0 ? ` (${count})` : ""}
            </NavLink>
            <NavLink to="/account" className="btn btn-ghost gap-2">
              <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-[10px] font-semibold text-white">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.[0]?.toUpperCase() || "?"
                )}
              </span>
              {user?.name?.split(" ")[0] || "Account"}
            </NavLink>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="btn btn-ghost">
              Login
            </NavLink>
            <NavLink to="/signup" className="btn btn-neutral">
              Sign Up
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
