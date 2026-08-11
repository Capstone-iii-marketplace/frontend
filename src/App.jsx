import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome.jsx";
import Home from "./pages/Home.jsx";
import Login from "./components/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Signup from "./pages/Signup.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* signed in */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
