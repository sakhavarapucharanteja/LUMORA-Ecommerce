import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./context/AdminRoute";

import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetails from "./pages/AdminOrderDetails";
import AdminDashboard from "./pages/AdminDashboard";

import Account from "./pages/Account";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <WishlistProvider>

          <Routes>

            {/* =========================
                MAIN PAGES
            ========================= */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/shop"
              element={<Shop />}
            />

            <Route
              path="/product/:id"
              element={<ProductDetails />}
            />

            {/* =========================
                CART / CHECKOUT
            ========================= */}

            <Route
              path="/cart"
              element={<Cart />}
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/order-success"
              element={<OrderSuccess />}
            />

            {/* =========================
                WISHLIST
            ========================= */}

            <Route
              path="/wishlist"
              element={<Wishlist />}
            />

            {/* =========================
                CUSTOMER ORDERS
            ========================= */}

            <Route
              path="/orders"
              element={<Orders />}
            />

            <Route
              path="/order/:id"
              element={<OrderDetails />}
            />

            {/* =========================
                AUTHENTICATION
            ========================= */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            {/* =========================
                ADMIN
            ========================= */}

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/order/:id"
              element={
                <AdminRoute>
                  <AdminOrderDetails />
                </AdminRoute>
              }
            />


            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />

          </Routes>

        </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;