import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import Navbar from "../components/Navbar";

import "./Checkout.css";

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwdazVnTkmkuw6re71g61azzBr-LTAew5clLjoZaNrlBcPH0f-deQrjJxA4eLZI13hU-g/exec";

const sendOrderToGoogleSheet = async (order) => {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(order),
      keepalive: true,
    });

    console.log("Order sent to Google Sheet.");
  } catch (error) {
    // Do NOT stop the order if Google Sheets fails.
    console.error("Google Sheet sync failed:", error);
  }
};

function Checkout() {
  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    phone: user?.phoneNumber || "",
    email: user?.email || "",
    address: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
  });


    useEffect(() => {
    const loadUserProfile = async () => {
        if (!user?.uid) return;

        try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            setFormData((previous) => ({
            ...previous,
            name: userData.name || user.displayName || "",
            phone: (() => {
            const rawPhone =
                userData.phone ||
                user.phoneNumber ||
                "";

            return rawPhone
                .replace(/\D/g, "")
                .replace(/^91/, "");
            })(),
            email: userData.email || user.email || "",
            }));
        }
        } catch (error) {
        console.error("Error loading user profile:", error);
        }
    };

    loadUserProfile();
    }, [user]);

  // =========================================================
  // SHIPPING
  // =========================================================

  const shipping = cartTotal >= 999 ? 0 : 99;

  // =========================================================
  // FINAL TOTAL
  // =========================================================

  const total = cartTotal + shipping;

  // =========================================================
  // HANDLE INPUT CHANGES
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // PLACE ORDER
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -------------------------------------------------------
    // LOGIN CHECK
    // -------------------------------------------------------

    if (!user) {
      alert("Please login to place your order.");

      navigate("/login", {
        state: {
          from: "/checkout",
        },
      });

      return;
    }

    // -------------------------------------------------------
    // CART CHECK
    // -------------------------------------------------------

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      navigate("/shop");
      return;
    }

    // -------------------------------------------------------
    // CLEAN FORM VALUES
    // -------------------------------------------------------

    const customerName = formData.name.trim();
    const phone = formData.phone
    .trim()
    .replace(/\D/g, "")
    .replace(/^91/, "");
    const email =
      formData.email.trim() || user.email || "";
    const address = formData.address.trim();
    const area = formData.area.trim();
    const city = formData.city.trim();
    const state = formData.state.trim();
    const pincode = formData.pincode.trim();

    // -------------------------------------------------------
    // REQUIRED FIELD VALIDATION
    // -------------------------------------------------------

    if (
      !customerName ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // -------------------------------------------------------
    // PHONE VALIDATION
    // -------------------------------------------------------

        // Validate phone number
        if (!/^\d{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
        }

    // -------------------------------------------------------
    // PIN CODE VALIDATION
    // -------------------------------------------------------

    if (!/^\d{6}$/.test(pincode)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    // -------------------------------------------------------
    // PREVENT DOUBLE CLICK
    // -------------------------------------------------------

    if (isPlacingOrder) {
      return;
    }

    try {
      setIsPlacingOrder(true);

      // =====================================================
      // CREATE ORDER REFERENCE
      // =====================================================

      const orderRef = doc(collection(db, "orders"));

      // =====================================================
      // GENERATE LUMORA ORDER ID
      // =====================================================

      const orderId =
        "LUM" + Date.now().toString().slice(-8);

      const createdAt = new Date().toISOString();

      // =====================================================
      // FIRESTORE TRANSACTION
      //
      // This transaction:
      //
      // 1. Reads every product
      // 2. Checks latest stock
      // 3. Stops if any item has insufficient stock
      // 4. Deducts stock
      // 5. Creates the order
      //
      // If anything fails, Firestore rolls everything back.
      // =====================================================

      const order = await runTransaction(
        db,
        async (transaction) => {
          // -------------------------------------------------
          // PRODUCT REFERENCES
          // -------------------------------------------------

          const productReferences = cartItems.map(
            (item) =>
              doc(
                db,
                "products",
                String(item.id)
              )
          );

          // -------------------------------------------------
          // READ ALL PRODUCTS FIRST
          //
          // Firestore transactions require all reads
          // to happen before writes.
          // -------------------------------------------------

          const productSnapshots = [];

          for (const productRef of productReferences) {
            const snapshot =
              await transaction.get(productRef);

            if (!snapshot.exists()) {
              const error = new Error(
                "One of the products in your cart is no longer available."
              );

              error.code = "PRODUCT_NOT_FOUND";

              throw error;
            }

            productSnapshots.push(snapshot);
          }

          // -------------------------------------------------
          // VALIDATE ALL STOCK
          // -------------------------------------------------

          const updatedItems = [];

          for (
            let index = 0;
            index < cartItems.length;
            index++
          ) {
            const cartItem = cartItems[index];

            const productSnapshot =
              productSnapshots[index];

            const productData =
              productSnapshot.data();

            const availableStock = Number(
              productData.stock ?? 0
            );

            const requestedQuantity = Number(
              cartItem.quantity ?? 0
            );

            // ---------------------------------------------
            // INVALID QUANTITY SAFETY CHECK
            // ---------------------------------------------

            if (
              !Number.isFinite(requestedQuantity) ||
              requestedQuantity <= 0
            ) {
              const error = new Error(
                "Invalid product quantity."
              );

              error.code = "INVALID_QUANTITY";

              throw error;
            }

            // ---------------------------------------------
            // STOCK CHECK
            // ---------------------------------------------

            if (
              !Number.isFinite(availableStock) ||
              availableStock < requestedQuantity
            ) {
              const productName =
                productData.name ||
                cartItem.name ||
                "This product";

              const error = new Error(
                `${productName} has only ${Math.max(
                  0,
                  availableStock
                )} item(s) available.`
              );

              error.code = "STOCK_UNAVAILABLE";

              error.productName = productName;

              error.availableStock = Math.max(
                0,
                availableStock
              );

              error.requestedQuantity =
                requestedQuantity;

              throw error;
            }

            // ---------------------------------------------
            // USE LATEST FIRESTORE PRODUCT DATA
            // ---------------------------------------------

            updatedItems.push({
              ...cartItem,

              id: cartItem.id,

              name:
                productData.name ??
                cartItem.name,

              price: Number(
                productData.price ??
                  cartItem.price ??
                  0
              ),

              image:
                productData.image ??
                cartItem.image ??
                "",

              category:
                productData.category ??
                cartItem.category ??
                "",

              quantity: requestedQuantity,
            });
          }

          // -------------------------------------------------
          // DEDUCT STOCK
          // -------------------------------------------------

          for (
            let index = 0;
            index < cartItems.length;
            index++
          ) {
            const cartItem = cartItems[index];

            const productSnapshot =
              productSnapshots[index];

            const productData =
              productSnapshot.data();

            const availableStock = Number(
              productData.stock ?? 0
            );

            const requestedQuantity = Number(
              cartItem.quantity ?? 0
            );

            const newStock =
              availableStock - requestedQuantity;

            // ---------------------------------------------
            // UPDATE ONLY STOCK
            // ---------------------------------------------

            transaction.update(
              productReferences[index],
              {
                stock: newStock,
              }
            );
          }

          // =================================================
          // CREATE ORDER
          // =================================================

          const newOrder = {
            orderId,

            // Customer
            userId: user.uid,

            customerName,

            phone,

            email,

            // Address
            address,

            area,

            city,

            state,

            pincode,

            // Products
            items: updatedItems,

            // Pricing
            subtotal: Number(cartTotal),

            shipping: Number(shipping),

            total: Number(total),

            // Payment
            paymentMethod:
              paymentMethod === "cod"
                ? "Cash on Delivery"
                : "Online Payment",

            // Status
            status: "Placed",

            // Date
            date: new Date().toLocaleDateString(
              "en-IN"
            ),

            createdAt,

            // Inventory
            stockDeducted: true,
          };

          // -------------------------------------------------
          // CREATE ORDER INSIDE SAME TRANSACTION
          // -------------------------------------------------

          transaction.set(
            orderRef,
            newOrder
          );

          return newOrder;
        }
      );

      // =====================================================
      // TRANSACTION SUCCESSFUL
      // =====================================================

      console.log(
        "Order successfully created:",
        order
      );


      // =====================================================
      // SEND ORDER TO GOOGLE SHEETS
      // =====================================================

        await sendOrderToGoogleSheet(order);

        console.log("Order sent to Google Sheet.");

      // =====================================================
      // SAVE LATEST ORDER
      // =====================================================

      localStorage.setItem(
        "lumoraLastOrder",
        JSON.stringify(order)
      );

      // =====================================================
      // CLEAR CART
      // =====================================================

      clearCart();

      // =====================================================
      // GO TO ORDER SUCCESS
      // =====================================================

      navigate("/order-success", {
        state: {
          order,
        },
      });
    } catch (error) {
      console.error(
        "Error placing order:",
        error
      );

      // =====================================================
      // PRODUCT NOT FOUND
      // =====================================================

      if (
        error.code ===
        "PRODUCT_NOT_FOUND"
      ) {
        alert(
          "One of the products in your cart is no longer available. Please refresh your cart and try again."
        );

        return;
      }

      // =====================================================
      // STOCK NOT AVAILABLE
      // =====================================================

      if (
        error.code ===
        "STOCK_UNAVAILABLE"
      ) {
        alert(
          `${error.productName} has only ${error.availableStock} available, but you requested ${error.requestedQuantity}.\n\nPlease reduce the quantity and try again.`
        );

        return;
      }

      // =====================================================
      // INVALID QUANTITY
      // =====================================================

      if (
        error.code ===
        "INVALID_QUANTITY"
      ) {
        alert(
          "One of the products has an invalid quantity. Please return to your cart and try again."
        );

        return;
      }

      // =====================================================
      // FIRESTORE PERMISSION ERROR
      // =====================================================

      if (
        error.code ===
        "permission-denied"
      ) {
        alert(
          "We couldn't update the inventory. Please contact the administrator."
        );

        return;
      }

      // =====================================================
      // GENERIC ERROR
      // =====================================================

      alert(
        "Something went wrong while placing your order. Please try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // =========================================================
  // WAIT FOR AUTHENTICATION
  // =========================================================

  if (authLoading) {
    return (
      <div>
        <Navbar />

        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily:
              "Arial, sans-serif",
            color: "#6f625d",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  // =========================================================
  // USER NOT LOGGED IN
  // =========================================================

  if (!user) {
    return (
      <div>
        <Navbar />

        <div className="checkout-empty">
          <h1>Please Login</h1>

          <p>
            You need to login before placing
            an order.
          </p>

          <Link
            to="/login"
            state={{
              from: "/checkout",
            }}
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (cartItems.length === 0) {
    return (
      <div>
        <Navbar />

        <div className="checkout-empty">
          <h1>Your Cart is Empty</h1>

          <p>
            Add some beautiful accessories
            before proceeding to checkout.
          </p>

          <Link to="/shop">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // CHECKOUT UI
  // =========================================================

  return (
    <div>
      <Navbar />

      <main className="checkout-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="checkout-header">

          <Link
            to="/cart"
            className="back-to-cart"
          >
            <ArrowLeft size={16} />

            Back to Cart
          </Link>

          <p>
            SECURE CHECKOUT
          </p>

          <h1>
            Checkout
          </h1>

        </div>

        {/* =================================================
            CHECKOUT FORM
        ================================================= */}

        <form
          className="checkout-layout"
          onSubmit={handleSubmit}
        >

          {/* ===============================================
              LEFT SIDE
          =============================================== */}

          <div className="checkout-form">

            {/* =============================================
                CONTACT INFORMATION
            ============================================= */}

            <section className="checkout-section">

              <div className="section-title">

                <span>
                  01
                </span>

                <div>

                  <h2>
                    Contact Information
                  </h2>

                  <p>
                    We'll use this to contact you
                    about your order.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                {/* NAME */}

                <div className="form-group full">

                  <label>
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />

                </div>

                {/* PHONE */}

                <div className="form-group">

                  <label>
                    Mobile Number *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    inputMode="numeric"
                    autoComplete="tel"
                  />

                </div>

                {/* EMAIL */}

                <div className="form-group">

                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />

                </div>

              </div>

            </section>

            {/* =============================================
                DELIVERY ADDRESS
            ============================================= */}

            <section className="checkout-section">

              <div className="section-title">

                <span>
                  02
                </span>

                <div>

                  <h2>
                    Delivery Address
                  </h2>

                  <p>
                    Where should we deliver your
                    order?
                  </p>

                </div>

              </div>

              <div className="form-grid">

                {/* ADDRESS */}

                <div className="form-group full">

                  <label>
                    Address *
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House / Flat / Street"
                    autoComplete="street-address"
                  />

                </div>

                {/* AREA */}

                <div className="form-group full">

                  <label>
                    Area / Landmark
                  </label>

                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Area or nearby landmark"
                  />

                </div>

                {/* CITY */}

                <div className="form-group">

                  <label>
                    City *
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    autoComplete="address-level2"
                  />

                </div>

                {/* STATE */}

                <div className="form-group">

                  <label>
                    State *
                  </label>

                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    autoComplete="address-level1"
                  />

                </div>

                {/* PIN */}

                <div className="form-group">

                  <label>
                    PIN Code *
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit PIN"
                    maxLength="6"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />

                </div>

              </div>

            </section>

            {/* =============================================
                PAYMENT
            ============================================= */}

            <section className="checkout-section">

              <div className="section-title">

                <span>
                  03
                </span>

                <div>

                  <h2>
                    Payment Method
                  </h2>

                  <p>
                    Choose how you'd like to pay.
                  </p>

                </div>

              </div>

              <div className="payment-options">

                {/* COD */}

                <label
                  className={`payment-option ${
                    paymentMethod === "cod"
                      ? "selected"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={
                      paymentMethod === "cod"
                    }
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                  />

                  <div>

                    <strong>
                      Cash on Delivery
                    </strong>

                    <span>
                      Pay when your order arrives.
                    </span>

                  </div>

                </label>

                {/* ONLINE */}

                <label
                  className={`payment-option ${
                    paymentMethod === "online"
                      ? "selected"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={
                      paymentMethod === "online"
                    }
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                  />

                  <div>

                    <strong>
                      Online Payment
                    </strong>

                    <span>
                      UPI, Cards, Net Banking and
                      more.
                    </span>

                  </div>

                </label>

              </div>

            </section>

          </div>

          {/* ===============================================
              RIGHT SIDE - ORDER SUMMARY
          =============================================== */}

          <aside className="checkout-summary">

            <h2>
              Order Summary
            </h2>

            {/* PRODUCTS */}

            <div className="checkout-products">

              {cartItems.map((item) => {

                const quantity =
                  Number(item.quantity) || 0;

                const price =
                  Number(item.price) || 0;

                return (
                  <div
                    className="checkout-product"
                    key={item.id}
                  >

                    <img
                      src={item.image}
                      alt={item.name}
                    />

                    <div>

                      <h3>
                        {item.name}
                      </h3>

                      <span>
                        Qty: {quantity}
                      </span>

                    </div>

                    <strong>
                      ₹
                      {(
                        price * quantity
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>
                );
              })}

            </div>

            <div className="checkout-divider" />

            {/* SUBTOTAL */}

            <div className="checkout-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {Number(
                  cartTotal
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            {/* SHIPPING */}

            <div className="checkout-row">

              <span>
                Shipping
              </span>

              <strong>
                {shipping === 0
                  ? "FREE"
                  : `₹${shipping}`}
              </strong>

            </div>

            <div className="checkout-divider" />

            {/* TOTAL */}

            <div className="checkout-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {Number(
                  total
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            {/* PLACE ORDER */}

            <button
              type="submit"
              className="place-order-button"
              disabled={isPlacingOrder}
            >
              {isPlacingOrder
                ? "Checking Stock..."
                : "Place Order"}
            </button>

            {/* SECURE CHECKOUT */}

            <div className="secure-checkout">

              <ShieldCheck size={18} />

              <span>
                Secure & encrypted checkout
              </span>

            </div>

          </aside>

        </form>

      </main>

    </div>
  );
}

export default Checkout;