import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

import Navbar from "../components/Navbar";

import "./OrderSuccess.css";

function OrderSuccess() {
  const location = useLocation();

  const order = location.state?.order;

  if (!order) {
    return (
      <div>
        <Navbar />

        <div className="order-not-found">
          <h1>Order Not Found</h1>

          <Link to="/shop">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <main className="success-page">

        <div className="success-icon">
          <CheckCircle size={60} />
        </div>

        <p className="success-label">
          ORDER CONFIRMED
        </p>

        <h1>Thank You for Your Order!</h1>

        <p className="success-message">
          Your order has been placed successfully.
          We'll start preparing it right away.
        </p>

        <div className="order-card">

          <div className="order-card-header">
            <div>
              <span>ORDER ID</span>
              <strong>{order.orderId}</strong>
            </div>

            <Package size={25} />
          </div>

          <div className="success-divider" />

          <div className="order-info">

            <div>
              <span>Order Total</span>
              <strong>
                ₹{order.total.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Payment Method</span>
              <strong>
                {order.paymentMethod}
              </strong>
            </div>

            <div>
              <span>Customer</span>
              <strong>
                {order.customerName}
              </strong>
            </div>

            <div>
              <span>Delivery City</span>
              <strong>
                {order.city}
              </strong>
            </div>

          </div>

        </div>

        <div className="success-actions">

          <Link
            to="/shop"
            className="continue-shopping-button"
          >
            Continue Shopping
            <ArrowRight size={17} />
          </Link>

          <Link
            to="/"
            className="home-button"
          >
            Back to Home
          </Link>

        </div>

      </main>
    </div>
  );
}

export default OrderSuccess;