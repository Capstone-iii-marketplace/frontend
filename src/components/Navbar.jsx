import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function NavBar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="w-full p-4 bg-base-200">
      <div className="container mx-auto flex items-center gap-4">
        <h2>PenThrive</h2>

        <div className="flex-1" />
        {isAuthenticated ? (
          <>
            <NavLink to="/home" className="font-bold">
              Dashboard
            </NavLink>
            <NavLink to="/my-listings" className="btn btn-ghost">
              My Listings
            </NavLink>
            <NavLink to="/checkout" className="btn btn-ghost">
              Cart{count > 0 ? ` (${count})` : ""}
            </NavLink>
            <span className="hidden text-sm text-base-content/70 sm:inline">
              {user?.email}
            </span>
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
