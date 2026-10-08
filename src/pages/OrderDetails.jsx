import { useEffect, useState } from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle,
  Package,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import Navbar from "../components/Navbar";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";

import "./OrderDetails.css";

function OrderDetails() {
  const { id } = useParams();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [order, setOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      // Wait for Firebase authentication
      if (authLoading) {
        return;
      }

      // User is not logged in
      if (!user) {
        setOrder(null);
        setOrderLoading(false);
        return;
      }

      try {
        setOrderLoading(true);
        setError("");

        /*
         * Find the order using:
         *
         * 1. orderId from the URL
         * 2. current user's Firebase UID
         *
         * This means a customer can only retrieve
         * their own order.
         */
        const ordersQuery = query(
          collection(db, "orders"),
          where("orderId", "==", id),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(
          ordersQuery
        );

        if (snapshot.empty) {
          setOrder(null);
          setOrderLoading(false);
          return;
        }

        const orderDocument =
          snapshot.docs[0];

        setOrder({
          firestoreId: orderDocument.id,
          ...orderDocument.data(),
        });

        setOrderLoading(false);
      } catch (error) {
        console.error(
          "Error loading order:",
          error
        );

        setError(
          "Unable to load this order. Please try again."
        );

        setOrderLoading(false);
      }
    };

    fetchOrder();
  }, [id, user, authLoading]);

  // ==========================================
  // AUTHENTICATION LOADING
  // ==========================================

  if (authLoading) {
    return (
      <div className="order-details-page">

        <Navbar />

        <main className="order-not-found">

          <p>
            Loading your account...
          </p>

        </main>

      </div>
    );
  }

  // ==========================================
  // USER NOT LOGGED IN
  // ==========================================

  if (!user) {
    return (
      <div className="order-details-page">

        <Navbar />

        <main className="order-not-found">

          <Package size={42} />

          <h1>
            Please Login
          </h1>

          <p>
            Please login to view your order.
          </p>

          <Link to="/login">
            Login
          </Link>

        </main>

      </div>
    );
  }

  // ==========================================
  // ORDER LOADING
  // ==========================================

  if (orderLoading) {
    return (
      <div className="order-details-page">

        <Navbar />

        <main className="order-not-found">

          <p>
            Loading order...
          </p>

        </main>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="order-details-page">

        <Navbar />

        <main className="order-not-found">

          <Package size={42} />

          <h1>
            Something Went Wrong
          </h1>

          <p>
            {error}
          </p>

          <Link to="/orders">
            Back to My Orders
          </Link>

        </main>

      </div>
    );
  }

  // ==========================================
  // ORDER NOT FOUND
  // ==========================================

  if (!order) {
    return (
      <div className="order-details-page">

        <Navbar />

        <main className="order-not-found">

          <Package size={42} />

          <h1>
            Order Not Found
          </h1>

          <p>
            We couldn't find this order in your account.
          </p>

          <Link to="/orders">
            Back to My Orders
          </Link>

        </main>

      </div>
    );
  }

  return (
    <div className="order-details-page">

      <Navbar />

      <main className="order-details-container">

        {/* ================================= */}
        {/* BACK BUTTON */}
        {/* ================================= */}

        <Link
          to="/orders"
          className="order-back"
        >
          <ArrowLeft size={16} />

          Back to My Orders
        </Link>

        {/* ================================= */}
        {/* ORDER HEADER */}
        {/* ================================= */}

        <div className="order-details-header">

          <div>

            <p>
              ORDER DETAILS
            </p>

            <h1>
              {order.orderId}
            </h1>

            <span>
              Placed on {order.date}
            </span>

          </div>

          <div className="order-status-badge">

            <CheckCircle size={17} />

            {order.status || "Placed"}

          </div>

        </div>

        {/* ================================= */}
        {/* ITEMS ORDERED */}
        {/* ================================= */}

        <section className="order-details-section">

          <div className="order-section-heading">

            <h2>
              Items Ordered
            </h2>

            <span>
              {order.items?.length || 0}{" "}
              item
              {order.items?.length !== 1
                ? "s"
                : ""}
            </span>

          </div>

          <div className="order-details-products">

            {order.items?.map(
              (item, index) => (

                <div
                  className="order-details-product"
                  key={`${item.id}-${index}`}
                >

                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <div className="order-details-product-info">

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      Quantity:{" "}
                      {item.quantity}
                    </p>

                    <span>
                      ₹
                      {Number(
                        item.price
                      ).toLocaleString(
                        "en-IN"
                      )}{" "}
                      each
                    </span>

                  </div>

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

              )
            )}

          </div>

        </section>

        {/* ================================= */}
        {/* DELIVERY + PAYMENT */}
        {/* ================================= */}

        <div className="order-info-grid">

          {/* DELIVERY ADDRESS */}

          <section className="order-details-section">

            <h2>
              Delivery Address
            </h2>

            <div className="address-details">

              <strong>
                {order.customerName}
              </strong>

              <span>
                {order.phone}
              </span>

              {order.email && (
                <span>
                  {order.email}
                </span>
              )}

              <span>
                {order.address}
              </span>

              {order.area && (
                <span>
                  {order.area}
                </span>
              )}

              <span>
                {order.city},{" "}
                {order.state}
              </span>

              <span>
                PIN - {order.pincode}
              </span>

            </div>

          </section>

          {/* PAYMENT INFORMATION */}

          <section className="order-details-section">

            <h2>
              Payment Information
            </h2>

            <div className="payment-details">

              <span>
                Payment Method
              </span>

              <strong>
                {order.paymentMethod}
              </strong>

            </div>

            <div className="payment-details">

              <span>
                Order Total
              </span>

              <strong className="order-total">
                ₹
                {Number(
                  order.total
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </section>

        </div>

        {/* ================================= */}
        {/* FOOTER */}
        {/* ================================= */}

        <div className="order-details-footer">

          <Link to="/shop">
            Continue Shopping
          </Link>

        </div>

      </main>

    </div>
  );
}

export default OrderDetails;