import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";

import {
  Search,
  Package,
  Eye,
  RefreshCw,
  CheckCircle,
  Truck,
  Clock,
  XCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { db } from "../firebase/firebase";

import "./AdminOrders.css";

function AdminOrders() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // =====================================================
  // LOAD ALL ORDERS
  // =====================================================

  useEffect(() => {
    setLoading(true);
    setError("");

    const ordersQuery = query(
      collection(db, "orders")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const allOrders = snapshot.docs.map(
          (doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
          })
        );

        // -------------------------------------------------
        // NEWEST ORDERS FIRST
        // -------------------------------------------------

        allOrders.sort((a, b) => {
          const dateA = new Date(
            a.createdAt || 0
          ).getTime();

          const dateB = new Date(
            b.createdAt || 0
          ).getTime();

          return dateB - dateA;
        });

        setOrders(allOrders);
        setLoading(false);
      },
      (firebaseError) => {
        console.error(
          "Error loading admin orders:",
          firebaseError
        );

        setError(
          "Unable to load orders. Please check your Firestore permissions."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =====================================================
  // FILTER ORDERS
  // =====================================================

  const filteredOrders = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !searchValue ||
        order.orderId
          ?.toLowerCase()
          .includes(searchValue) ||
        order.customerName
          ?.toLowerCase()
          .includes(searchValue) ||
        order.email
          ?.toLowerCase()
          .includes(searchValue) ||
        order.phone
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    orders,
    search,
    statusFilter,
  ]);

  // =====================================================
  // ORDER COUNTS
  // =====================================================

  const totalOrders = orders.length;

  const placedOrders = orders.filter(
    (order) =>
      order.status === "Placed"
  ).length;

  const confirmedOrders = orders.filter(
    (order) =>
      order.status === "Confirmed"
  ).length;

  const shippedOrders = orders.filter(
    (order) =>
      order.status === "Shipped"
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "Delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
  ).length;

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };

  // =====================================================
  // GET TOTAL ORDER QUANTITY
  // =====================================================

  const getOrderQuantity = (order) => {
    return (
      order.items?.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      ) || 0
    );
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    window.location.reload();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-orders-page">
        <Navbar />

        <main className="admin-orders-container">

          <div className="admin-loading">

            <RefreshCw
              size={30}
              className="admin-loading-icon"
            />

            <p>
              Loading orders...
            </p>

          </div>

        </main>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="admin-orders-page">

      <Navbar />

      <main className="admin-orders-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-orders-header">

          <div>

            <p className="admin-eyebrow">
              LUMORA ADMIN
            </p>

            <h1>
              Orders
            </h1>

            <span>
              Manage customer orders and track
              their status.
            </span>

          </div>

        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="admin-summary-grid">

          {/* TOTAL */}

          <div className="admin-summary-card">

            <div className="admin-summary-icon total">
              <Package size={20} />
            </div>

            <div>

              <span>
                Total Orders
              </span>

              <strong>
                {totalOrders}
              </strong>

            </div>

          </div>

          {/* PLACED */}

          <div className="admin-summary-card">

            <div className="admin-summary-icon placed">
              <Clock size={20} />
            </div>

            <div>

              <span>
                Placed
              </span>

              <strong>
                {placedOrders}
              </strong>

            </div>

          </div>

          {/* CONFIRMED */}

          <div className="admin-summary-card">

            <div className="admin-summary-icon confirmed">
              <CheckCircle size={20} />
            </div>

            <div>

              <span>
                Confirmed
              </span>

              <strong>
                {confirmedOrders}
              </strong>

            </div>

          </div>

          {/* SHIPPED */}

          <div className="admin-summary-card">

            <div className="admin-summary-icon shipped">
              <Truck size={20} />
            </div>

            <div>

              <span>
                Shipped
              </span>

              <strong>
                {shippedOrders}
              </strong>

            </div>

          </div>

          {/* DELIVERED */}

          <div className="admin-summary-card">

            <div className="admin-summary-icon delivered">
              <CheckCircle size={20} />
            </div>

            <div>

              <span>
                Delivered
              </span>

              <strong>
                {deliveredOrders}
              </strong>

            </div>

          </div>


          {/* CANCELLED */}

            <div className="admin-summary-card">
            <div className="admin-summary-icon cancelled">
                <XCircle size={20} />
            </div>

            <div>
                <span>
                Cancelled
                </span>

                <strong>
                {cancelledOrders}
                </strong>
            </div>
            </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="admin-filter-bar">

          {/* SEARCH */}

          <div className="admin-search">

            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search order, customer, email..."
            />

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="admin-status-filter"
          >

            <option value="All">
              All Statuses
            </option>

            <option value="Placed">
              Placed
            </option>

            <option value="Confirmed">
              Confirmed
            </option>

            <option value="Shipped">
              Shipped
            </option>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

          </select>

          {/* REFRESH */}

          <button
            type="button"
            className="admin-refresh-button"
            onClick={handleRefresh}
            title="Refresh orders"
          >
            <RefreshCw size={17} />
          </button>

        </div>

        {/* =================================================
            NO ORDERS
        ================================================= */}

        {filteredOrders.length === 0 ? (

          <div className="admin-empty">

            <Package size={44} />

            <h2>
              No Orders Found
            </h2>

            <p>
              No orders match your current
              search or filter.
            </p>

          </div>

        ) : (

          /* =================================================
             ORDERS TABLE
          ================================================= */

          <div className="admin-orders-table-wrapper">

            <table className="admin-orders-table">

              <thead>

                <tr>

                  <th>
                    Order
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredOrders.map(
                  (order) => (

                    <tr
                      key={
                        order.firestoreId
                      }
                    >

                      {/* =================================
                          ORDER
                      ================================= */}

                      <td>

                        <div className="admin-order-id">

                          <strong>
                            {order.orderId}
                          </strong>

                          <span>
                            {getOrderQuantity(
                              order
                            )}{" "}

                            {getOrderQuantity(
                              order
                            ) === 1
                              ? "item"
                              : "items"}

                          </span>

                        </div>

                      </td>

                      {/* =================================
                          CUSTOMER
                      ================================= */}

                      <td>

                        <div className="admin-customer">

                          <strong>
                            {order.customerName ||
                              "Customer"}
                          </strong>

                          <span>
                            {order.email ||
                              order.phone ||
                              "—"}
                          </span>

                        </div>

                      </td>

                      {/* =================================
                          DATE
                      ================================= */}

                      <td>

                        <span className="admin-date">
                          {order.date || "—"}
                        </span>

                      </td>

                      {/* =================================
                          TOTAL
                      ================================= */}

                      <td>

                        <strong className="admin-total">
                          {formatPrice(
                            order.total
                          )}
                        </strong>

                      </td>

                      {/* =================================
                          PAYMENT
                      ================================= */}

                      <td>

                        <span className="admin-payment">
                          {order.paymentMethod ||
                            "—"}
                        </span>

                      </td>

                      {/* =================================
                          STATUS
                      ================================= */}

                      <td>

                        <span
                          className={`admin-status admin-status-${(
                            order.status ||
                            "Placed"
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >

                          {order.status ||
                            "Placed"}

                        </span>

                      </td>

                      {/* =================================
                          ACTION
                      ================================= */}

                      <td>

                        <button
                          type="button"
                          className="admin-view-button"
                          onClick={() =>
                            navigate(
                              `/admin/order/${order.orderId}`
                            )
                          }
                        >

                          <Eye size={16} />

                          View

                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

        {/* =================================================
            RESULT COUNT
        ================================================= */}

        {filteredOrders.length > 0 && (

          <div className="admin-results-count">

            Showing{" "}

            <strong>
              {filteredOrders.length}
            </strong>

            {" "}of{" "}

            <strong>
              {orders.length}
            </strong>

            {" "}orders

          </div>

        )}

      </main>

    </div>
  );
}

export default AdminOrders;