import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome.jsx";
import Home from "./pages/Home.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import Checkout from "./pages/Checkout.jsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.jsx";
import PostListing from "./pages/PostListing.jsx";
import MyListings from "./pages/MyListings.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Account from "./pages/Account.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Signup from "./pages/Signup.jsx";
import { AuthContext, AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import Messages from "./pages/Messages.jsx";
import { CallProvider } from "./context/CallContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import "./App.css";

// Root component — defines every page route (the app's sitemap) and wraps
// the whole tree in the Auth and Cart context providers so any page can
// read who's logged in (useAuth) or what's in the cart (useCart).
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <CallProvider>
              <CartProvider>
                <Routes>
                  {/* public — anyone can browse listings, logged in or not */}
                  <Route path="/" element={<Welcome />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  {/* signed in — buying and selling both require an account.
                ProtectedRoute redirects to /login if there's no user.
                AppLayout renders NavBar once for every route nested here,
                so no individual page has to remember to include it. */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/home" element={<Home />} />
                      <Route
                        path="/listings/:id"
                        element={<ListingDetail />}
                      />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route
                        path="/checkout/success"
                        element={<CheckoutSuccess />}
                      />
                      <Route path="/sell" element={<PostListing />} />
                      <Route
                        path="/listings/:id/edit"
                        element={<PostListing />}
                      />
                      <Route path="/my-listings" element={<MyListings />} />
                      <Route path="/users/:id" element={<UserProfile />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/messages/:id" element={<Messages />} />
                    </Route>
                  </Route>
                </Routes>
              </CartProvider>
            </CallProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
