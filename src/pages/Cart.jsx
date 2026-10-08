import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";

import "./Cart.css";

function Cart() {
  const {
    cartItems,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const navigate = useNavigate();


  // =========================
  // EMPTY CART
  // =========================

  if (cartItems.length === 0) {
    return (
      <div>
        <Navbar />

        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛍️
          </div>

          <h1>
            Your Cart is Empty
          </h1>

          <p>
            Looks like you haven't added
            anything to your cart yet.
          </p>

          <Link
            to="/shop"
            className="continue-shopping"
          >
            Continue Shopping
          </Link>

        </div>
      </div>
    );
  }


  return (
    <div>

      {/* =========================
          NAVBAR
      ========================= */}

      <Navbar />


      {/* =========================
          CART PAGE
      ========================= */}

      <div className="cart-page">


        {/* =========================
            HEADER
        ========================= */}

        <div className="cart-header">

          <p>
            YOUR BAG
          </p>

          <h1>
            Shopping Cart
          </h1>

        </div>


        {/* =========================
            CONTENT
        ========================= */}

        <div className="cart-content">


          {/* =========================
              CART ITEMS
          ========================= */}

          <div className="cart-items">

            {cartItems.map((item) => {

              const stock = Number(
                item.stock ?? 0
              );

              const quantity = Number(
                item.quantity ?? 1
              );

              const isAtStockLimit =
                Number.isFinite(stock) &&
                stock > 0 &&
                quantity >= stock;

              const isOutOfStock =
                Number.isFinite(stock) &&
                stock <= 0;


              return (
                <div
                  className="cart-item"
                  key={item.id}
                >


                  {/* =========================
                      PRODUCT IMAGE
                  ========================= */}

                  <img
                    src={item.image}
                    alt={item.name}
                  />


                  {/* =========================
                      PRODUCT INFO
                  ========================= */}

                  <div className="cart-item-info">

                    <p>
                      {item.category}
                    </p>

                    <h3>
                      {item.name}
                    </h3>

                    <strong>
                      ₹
                      {Number(
                        item.price || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>


                    {/* =========================
                        STOCK INFO
                    ========================= */}

                    {isOutOfStock ? (
                      <span className="cart-stock-status cart-stock-out">
                        <span className="cart-stock-dot" />
                        Out of Stock
                      </span>
                    ) : (
                      <span className="cart-stock-status cart-stock-in">
                        <span className="cart-stock-dot" />
                        {stock} available
                      </span>
                    )}


                    <div className="cart-item-bottom">


                      {/* =========================
                          QUANTITY
                      ========================= */}

                      <div className="cart-quantity">

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              quantity - 1
                            )
                          }
                          disabled={
                            quantity <= 1
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus
                            size={14}
                          />
                        </button>


                        <span>
                          {quantity}
                        </span>


                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              quantity + 1
                            )
                          }
                          disabled={
                            isAtStockLimit ||
                            isOutOfStock
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus
                            size={14}
                          />
                        </button>

                      </div>


                      {/* =========================
                          REMOVE
                      ========================= */}

                      <button
                        type="button"
                        className="remove-item"
                        onClick={() =>
                          removeFromCart(
                            item.id
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />

                        Remove
                      </button>

                    </div>

                  </div>


                  {/* =========================
                      ITEM TOTAL
                  ========================= */}

                  <div className="cart-item-total">

                    ₹
                    {(
                      Number(
                        item.price || 0
                      ) *
                      quantity
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </div>

                </div>
              );
            })}

          </div>


          {/* =========================
              ORDER SUMMARY
          ========================= */}

          <aside className="cart-summary">

            <h2>
              Order Summary
            </h2>


            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {cartTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Shipping
              </span>

              <span>
                {cartTotal >= 999
                  ? "FREE"
                  : "₹99"}
              </span>

            </div>


            <div className="summary-divider" />


            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {(
                  cartTotal +
                  (cartTotal >= 999
                    ? 0
                    : 99)
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            <button
              type="button"
              className="checkout-button"
              onClick={() =>
                navigate("/checkout")
              }
            >
              Proceed to Checkout
            </button>


            <Link
              to="/shop"
              className="continue-link"
            >
              Continue Shopping
            </Link>

          </aside>

        </div>

      </div>

    </div>
  );
}

export default Cart;