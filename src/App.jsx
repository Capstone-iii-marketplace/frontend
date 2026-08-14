import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome.jsx";
import Home from "./pages/Home.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import Checkout from "./pages/Checkout.jsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.jsx";
import PostListing from "./pages/PostListing.jsx";
import MyListings from "./pages/MyListings.jsx";
import Login from "./components/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Signup from "./pages/Signup.jsx";
import { AuthContext, AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./App.css";

// Root component — defines every page route (the app's sitemap) and wraps
// the whole tree in the Auth and Cart context providers so any page can
// read who's logged in (useAuth) or what's in the cart (useCart).
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* public — anyone can browse listings, logged in or not */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* signed in — buying and selling both require an account.
                ProtectedRoute redirects to /login if there's no user. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/sell" element={<PostListing />} />
              <Route path="/listings/:id/edit" element={<PostListing />} />
              <Route path="/my-listings" element={<MyListings />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
