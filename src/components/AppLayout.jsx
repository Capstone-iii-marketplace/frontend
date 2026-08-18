import { Outlet } from "react-router-dom";
import NavBar from "./Navbar";

// Renders the navbar once for every authenticated page, so a page can't
// forget to include it (which is exactly how Messages.jsx ended up with no
// way back to the dashboard except the browser's back button).
function AppLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}

export default AppLayout;
