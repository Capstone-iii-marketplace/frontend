import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function NavBar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="w-full p-4 bg-base-200">
      <div className="container mx-auto flex items-center gap-4">
        <NavLink to="/" className="font-bold">
          Home
        </NavLink>
        <div className="flex-1" />
        {isAuthenticated ? (
          <>
            <span className="hidden text-sm text-base-content/70 sm:inline">
              {user?.email}
            </span>
            <button type="button" className="btn btn-ghost" onClick={logout}>
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
