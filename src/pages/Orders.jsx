import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  Package,
  ArrowRight,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import Navbar from "../components/Navbar";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";

import "./Orders.css";

function Orders() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Wait until Firebase Authentication finishes loading
    if (authLoading) {
      return;
    }

    // No logged-in user
    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    setError("");

    // Query only this user's orders
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    // Listen for real-time changes
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const userOrders = snapshot.docs.map(
          (doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
          })
        );

        // Newest orders first
        userOrders.sort((a, b) => {
          const dateA = new Date(
            a.createdAt || 0
          ).getTime();

          const dateB = new Date(
            b.createdAt || 0
          ).getTime();

          return dateB - dateA;
        });

        setOrders(userOrders);
        setOrdersLoading(false);
      },
      (error) => {
        console.error(
          "Error loading orders:",
          error
        );

        setError(
          "Unable to load your orders. Please try again."
        );

        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Firebase authentication loading
  if (authLoading) {
    return (
      <div className="orders-page">

        <Navbar />

        <main className="orders-container">

          <div className="orders-empty">
            <p>
              Loading your account...
            </p>
          </div>

        </main>

      </div>
    );
  }

  // User is not logged in
  if (!user) {
    return (
      <div className="orders-page">

        <Navbar />

        <main className="orders-container">

          <div className="orders-empty">

            <Package size={42} />

            <h2>
              Please Login
            </h2>

            <p>
              Login to view your orders.
            </p>

            <Link to="/login">
              Login
            </Link>

          </div>

        </main>

      </div>
    );
  }

  // Orders loading
  if (ordersLoading) {
    return (
      <div className="orders-page">

        <Navbar />

        <main className="orders-container">

          <div className="orders-empty">

            <p>
              Loading your orders...
            </p>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="orders-page">

      <Navbar />

      <main className="orders-container">

        <div className="orders-heading">

          <p>
            YOUR ACCOUNT
          </p>

          <h1>
            My Orders
          </h1>

          <span>
            View your recent LUMORA purchases.
          </span>

        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "20px",
              marginBottom: "24px",
              border: "1px solid #e5d7d3",
              background: "#fff8f6",
              color: "#a45d66",
            }}
          >
            {error}
          </div>
        )}

        {/* No orders */}
        {orders.length === 0 ? (

          <div className="orders-empty">

            <Package size={42} />

            <h2>
              No orders yet
            </h2>

            <p>
              You haven't placed any orders
              with LUMORA yet.
            </p>

            <Link to="/shop">
              Start Shopping
            </Link>

          </div>

        ) : (

          <div className="orders-list">

            {orders.map((order) => (

              <article
                className="order-card"
                key={order.firestoreId}
              >

                {/* ========================= */}
                {/* ORDER HEADER */}
                {/* ========================= */}

                <div className="order-top">

                  <div>

                    <span>
                      ORDER ID
                    </span>

                    <strong>
                      {order.orderId}
                    </strong>

                  </div>

                  <div>

                    <span>
                      DATE
                    </span>

                    <strong>
                      {order.date}
                    </strong>

                  </div>

                  <div>

                    <span>
                      STATUS
                    </span>

                    <strong className="order-status">
                      {order.status || "Placed"}
                    </strong>

                  </div>

                </div>

                {/* ========================= */}
                {/* ORDER PRODUCTS */}
                {/* ========================= */}

                <div className="order-products">

                  {order.items?.map(
                    (item, index) => (

                      <div
                        className="order-product"
                        key={`${item.id}-${index}`}
                      >

                        <img
                          src={item.image}
                          alt={item.name}
                        />

                        <div className="order-product-info">

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            Quantity:{" "}
                            {item.quantity}
                          </p>

                          <strong>
                            ₹
                            {(
                              Number(item.price) *
                              Number(item.quantity)
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </div>

                      </div>

                    )
                  )}

                </div>

                {/* ========================= */}
                {/* ORDER FOOTER */}
                {/* ========================= */}

                <div className="order-bottom">

                  <div>

                    <span>
                      Total
                    </span>

                    <strong>
                      ₹
                      {Number(
                        order.total
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Payment
                    </span>

                    <strong>
                      {order.paymentMethod ||
                        "Cash on Delivery"}
                    </strong>

                  </div>

                  <Link
                    to={`/order/${order.orderId}`}
                    className="view-order-button"
                  >
                    View Order

                    <ArrowRight size={16} />
                  </Link>

                </div>

              </article>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

export default Orders;