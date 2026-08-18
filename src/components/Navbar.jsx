import { Link, NavLink, useNavigate } from "react-router-dom";
import { PenLine } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Top navigation bar, rendered once by AppLayout for every authenticated
// page. Adapts its links based on auth state (Dashboard/Cart/Logout vs.
// Login/Sign Up).
function NavBar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  // Logs the user out, then sends them back to the landing page.
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="w-full p-4 bg-base-200">
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
            <NavLink to="/account" className="btn btn-ghost">
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
            <NavLink to="/signup" className="btn btn-primary">
              Sign Up
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
