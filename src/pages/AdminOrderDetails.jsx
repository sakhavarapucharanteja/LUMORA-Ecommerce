import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  User,
  RefreshCw,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { db } from "../firebase/firebase";

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";

import "./AdminOrderDetails.css";

function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const ordersQuery = query(
          collection(db, "orders"),
          where("orderId", "==", id)
        );

        const snapshot = await getDocs(ordersQuery);

        if (snapshot.empty) {
          setOrder(null);
          setError("Order not found.");
          return;
        }

        const orderDoc = snapshot.docs[0];

        const orderData = {
          firestoreId: orderDoc.id,
          ...orderDoc.data(),
        };

        setOrder(orderData);
        setSelectedStatus(orderData.status || "Placed");
      } catch (err) {
        console.error("Error loading admin order:", err);
        setError("Unable to load this order.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

    const handleStatusUpdate = async () => {
    if (!order || !selectedStatus) return;

    if (selectedStatus === order.status) {
        return;
    }

    try {
        setUpdating(true);
        setError("");

        const orderQuery = query(
        collection(db, "orders"),
        where("orderId", "==", order.orderId)
        );

        const snapshot = await getDocs(orderQuery);

        if (snapshot.empty) {
        throw new Error("Order document not found.");
        }

        const orderDoc = snapshot.docs[0];

        /*
        * ============================================================
        * CANCEL ORDER + RESTORE STOCK
        * ============================================================
        */

        if (
        selectedStatus === "Cancelled" &&
        order.status !== "Cancelled"
        ) {
        await runTransaction(db, async (transaction) => {
            // Get the latest order inside the transaction
            const latestOrderSnapshot = await transaction.get(orderDoc.ref);

            if (!latestOrderSnapshot.exists()) {
            throw new Error("Order document not found.");
            }

            const latestOrder = latestOrderSnapshot.data();

            /*
            * Prevent duplicate stock restoration.
            */
            if (
            latestOrder.status === "Cancelled" ||
            latestOrder.stockRestored === true
            ) {
            transaction.update(orderDoc.ref, {
                status: "Cancelled",
            });

            return;
            }

            /*
            * Only restore stock if checkout actually deducted stock.
            *
            * This protects older orders created before inventory
            * deduction was implemented.
            */
            if (latestOrder.stockDeducted === true) {
            const items = Array.isArray(latestOrder.items)
                ? latestOrder.items
                : [];

            const productRefs = items.map((item) =>
                doc(db, "products", String(item.id))
            );

            /*
            * IMPORTANT:
            * Read all products before doing any writes.
            */
            const productSnapshots = [];

            for (const productRef of productRefs) {
                const productSnapshot =
                await transaction.get(productRef);

                productSnapshots.push(productSnapshot);
            }

            /*
            * Restore the quantity for every ordered product.
            */
            for (let index = 0; index < items.length; index++) {
                const item = items[index];

                const productSnapshot =
                productSnapshots[index];

                if (!productSnapshot.exists()) {
                throw new Error(
                    `Product "${item.name || item.id}" no longer exists.`
                );
                }

                const quantity = Number(item.quantity || 0);

                if (!Number.isFinite(quantity) || quantity <= 0) {
                continue;
                }

                const productData =
                productSnapshot.data();

                const currentStock =
                Number(productData.stock ?? 0);

                if (
                !Number.isFinite(currentStock) ||
                currentStock < 0
                ) {
                throw new Error(
                    `Invalid stock value for "${item.name || item.id}".`
                );
                }

                const restoredStock =
                currentStock + quantity;

                transaction.update(productRefs[index], {
                stock: restoredStock,
                });
            }

            /*
            * Mark the order as cancelled and remember that
            * stock has already been restored.
            */
            transaction.update(orderDoc.ref, {
                status: "Cancelled",
                stockRestored: true,
                cancelledAt: new Date().toISOString(),
            });
            } else {
            /*
            * Older orders didn't deduct stock.
            * Cancel the order without changing inventory.
            */
            transaction.update(orderDoc.ref, {
                status: "Cancelled",
            });
            }
        });

        /*
        * Update the UI immediately.
        */
        setOrder((prev) => ({
            ...prev,
            status: "Cancelled",
            stockRestored:
            prev.stockDeducted === true
                ? true
                : prev.stockRestored,
        }));

        return;
        }

        /*
        * ============================================================
        * NORMAL STATUS UPDATE
        * ============================================================
        */

        await updateDoc(orderDoc.ref, {
        status: selectedStatus,
        });

        setOrder((prev) => ({
        ...prev,
        status: selectedStatus,
        }));
    } catch (err) {
        console.error(
        "Error updating order status:",
        err
        );

        if (
        err?.message?.includes("no longer exists")
        ) {
        setError(
            "Unable to cancel the order because one of its products no longer exists."
        );
        } else if (
        err?.message?.includes("Invalid stock value")
        ) {
        setError(
            "Unable to cancel the order because a product has an invalid stock value."
        );
        } else {
        setError(
            "Unable to update order status. Please try again."
        );
        }
    } finally {
        setUpdating(false);
    }
 };

 

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="admin-order-loading">
          <RefreshCw size={24} className="admin-loading-icon" />
          <p>Loading order...</p>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />

        <div className="admin-order-not-found">
          <Package size={45} />

          <h2>Order Not Found</h2>

          <p>{error || "This order could not be found."}</p>

          <Link to="/admin/orders" className="admin-back-button">
            <ArrowLeft size={17} />
            Back to Orders
          </Link>
        </div>
      </>
    );
  }

  const addressParts = [
    order.address,
    order.area,
    order.city,
    order.state,
    order.pincode,
  ].filter(Boolean);

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "status-confirmed";

      case "Shipped":
        return "status-shipped";

      case "Delivered":
        return "status-delivered";

      case "Cancelled":
        return "status-cancelled";

      default:
        return "status-placed";
    }
  };

  return (
    <>
      <Navbar />

      <main className="admin-order-details-page">
        <div className="admin-order-details-container">

          {/* Back */}
          <button
            className="admin-order-back"
            onClick={() => navigate("/admin/orders")}
          >
            <ArrowLeft size={18} />
            Back to Orders
          </button>

          {/* Header */}
          <div className="admin-order-details-header">
            <div>
              <div className="admin-small-label">
                LUMORA ADMIN
              </div>

              <h1>Order Details</h1>

              <p>
                Order #{order.orderId}
              </p>
            </div>

            <div
              className={`admin-large-status ${getStatusClass(
                order.status
              )}`}
            >
              {order.status || "Placed"}
            </div>
          </div>

          {error && (
            <div className="admin-order-error">
              {error}
            </div>
          )}

          {/* Main Grid */}
          <div className="admin-order-grid">

            {/* Customer */}
            <section className="admin-order-card">
              <div className="admin-card-title">
                <User size={19} />
                Customer Information
              </div>

              <div className="admin-info-row">
                <span>Name</span>
                <strong>{order.customerName || "—"}</strong>
              </div>

              <div className="admin-info-row">
                <span>Email</span>
                <strong>{order.email || "—"}</strong>
              </div>

              <div className="admin-info-row">
                <span>Phone</span>
                <strong>{order.phone || "—"}</strong>
              </div>
            </section>

            {/* Delivery */}
            <section className="admin-order-card">
              <div className="admin-card-title">
                <MapPin size={19} />
                Delivery Address
              </div>

              <div className="admin-address">
                {addressParts.length > 0 ? (
                  addressParts.map((part, index) => (
                    <div key={index}>{part}</div>
                  ))
                ) : (
                  <span>No address available</span>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="admin-order-card">
              <div className="admin-card-title">
                <CreditCard size={19} />
                Payment Information
              </div>

              <div className="admin-info-row">
                <span>Payment Method</span>
                <strong>
                  {order.paymentMethod || "—"}
                </strong>
              </div>

              <div className="admin-info-row">
                <span>Order Date</span>
                <strong>{order.date || "—"}</strong>
              </div>

              <div className="admin-info-row">
                <span>Total</span>
                <strong className="admin-total">
                  ₹{Number(order.total || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </section>

            {/* Status Update */}
            <section className="admin-order-card status-card">
              <div className="admin-card-title">
                <Truck size={19} />
                Update Order Status
              </div>

              <div className="admin-status-update">
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={updating}
                    >
                    {order.status === "Placed" && (
                        <>
                        <option value="Placed">Placed</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                        </>
                    )}

                    {order.status === "Confirmed" && (
                        <>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Cancelled">Cancelled</option>
                        </>
                    )}

                    {order.status === "Shipped" && (
                        <>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        </>
                    )}

                    {order.status === "Delivered" && (
                        <option value="Delivered">Delivered</option>
                    )}

                    {order.status === "Cancelled" && (
                        <option value="Cancelled">Cancelled</option>
                    )}
                </select>

                <button
                  onClick={handleStatusUpdate}
                  disabled={
                    updating ||
                    selectedStatus === order.status
                  }
                >
                  {updating ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="admin-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Update Status
                    </>
                  )}
                </button>
              </div>

              <div className="admin-status-flow">
                <span
                  className={
                    order.status === "Placed"
                      ? "active"
                      : ""
                  }
                >
                  Placed
                </span>

                <span>→</span>

                <span
                  className={
                    order.status === "Confirmed"
                      ? "active"
                      : ""
                  }
                >
                  Confirmed
                </span>

                <span>→</span>

                <span
                  className={
                    order.status === "Shipped"
                      ? "active"
                      : ""
                  }
                >
                  Shipped
                </span>

                <span>→</span>

                <span
                  className={
                    order.status === "Delivered"
                      ? "active"
                      : ""
                  }
                >
                  Delivered
                </span>
              </div>
            </section>
          </div>

          {/* Products */}
          <section className="admin-products-card">
            <div className="admin-card-title">
              <Package size={19} />
              Ordered Products
            </div>

            <div className="admin-products-list">
              {(order.items || []).map((item, index) => {
                const quantity = Number(item.quantity || 1);
                const price = Number(item.price || 0);
                const subtotal = price * quantity;

                return (
                  <div
                    className="admin-product-row"
                    key={`${item.id || item.name}-${index}`}
                  >
                    <div className="admin-product-image">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                        />
                      ) : (
                        <Package size={24} />
                      )}
                    </div>

                    <div className="admin-product-info">
                      <h3>{item.name}</h3>

                      <p>
                        ₹{price.toLocaleString("en-IN")} ×{" "}
                        {quantity}
                      </p>
                    </div>

                    <div className="admin-product-subtotal">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-products-total">
              <span>Order Total</span>

              <strong>
                ₹
                {Number(order.total || 0).toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default AdminOrderDetails;