import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, PenLine, ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Top navigation bar, rendered once by AppLayout for every authenticated
// page. Adapts its links based on auth state (Dashboard/Cart/Logout vs.
// Login/Sign Up), and collapses into a dropdown below md so the links don't
// run off the side of a phone screen.
function NavBar({ dark = false }) {
  const { isAuthenticated, logout, user } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  // Logs the user out, then sends them back to the landing page.
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // <details> stays open after a link navigates, so close it by hand. The
  // focus-based dropdown daisyUI shows in its docs doesn't open on a phone
  // tap at all, which is exactly where this menu matters.
  const closeMenu = (e) => e.currentTarget.closest("details")?.removeAttribute("open");

  const links = isAuthenticated
    ? [
        { to: "/home", label: "Dashboard" },
        { to: "/my-listings", label: "My Listings" },
        { to: "/messages", label: "Messages" },
        { to: "/checkout", label: count > 0 ? `Cart (${count})` : "Cart" },
      ]
    : [];

  const avatar = (
    <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-[10px] font-semibold text-white">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        user?.name?.[0]?.toUpperCase() || "?"
      )}
    </span>
  );

  return (
    <nav
      className={`sticky top-0 z-20 flex h-14 w-full items-center border-b px-4 backdrop-blur-md ${
        // Light pages (dashboard, listings) keep the default; the GIF-backed
        // auth pages pass dark so the bar doesn't read as a foreign slab.
        dark
          ? "border-white/10 bg-gray-950/30 text-white"
          : "border-white/20 bg-base-200/60"
      }`}
    >
      <div className="container mx-auto flex h-full items-center gap-2">
        {isAuthenticated && (
          <details className="dropdown md:hidden">
            <summary
              aria-label="Open menu"
              className="btn btn-ghost btn-sm px-2"
            >
              <Menu size={20} />
            </summary>
            <ul className="menu dropdown-content z-30 mt-2 w-56 rounded-box bg-base-100 p-2 text-base-content shadow-lg">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} onClick={closeMenu}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink to="/account" onClick={closeMenu}>
                  Account
                </NavLink>
              </li>
              <li>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </details>
        )}

        {/* nowrap: the three-word brand otherwise stacks on a phone. */}
        <Link
          to={isAuthenticated ? "/home" : "/"}
          className="font-display flex shrink-0 items-center gap-1.5 whitespace-nowrap text-lg font-bold"
        >
          Sell Me A Pen
          <PenLine size={18} strokeWidth={2.25} className="text-emerald-600" />
        </Link>

        <div className="flex-1" />

        {isAuthenticated ? (
          <>
            {/* Full link row, md and up. */}
            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className="btn btn-ghost btn-sm">
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/account" className="btn btn-ghost btn-sm gap-2">
                {avatar}
                {user?.name?.split(" ")[0] || "Account"}
              </NavLink>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>

            {/* Below md the dropdown holds the links, but cart and profile
                stay reachable in one tap. */}
            <div className="flex items-center gap-1 md:hidden">
              <NavLink
                to="/checkout"
                aria-label="Cart"
                className="btn btn-ghost btn-sm relative px-2"
              >
                <ShoppingCart size={18} />
                {count > 0 && (
                  <span className="badge badge-primary badge-xs absolute -right-0.5 -top-0.5">
                    {count}
                  </span>
                )}
              </NavLink>
              <NavLink to="/account" aria-label="Account" className="btn btn-ghost btn-sm px-2">
                {avatar}
              </NavLink>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <NavLink to="/login" className="btn btn-ghost btn-sm">
              Login
            </NavLink>
            <NavLink to="/signup" className="btn btn-neutral btn-sm">
              Sign Up
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
