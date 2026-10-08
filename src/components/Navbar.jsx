import { Link, useNavigate } from "react-router-dom";

import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  UserRound,
  Package,
  ArrowRight,
  ChevronRight,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

import products from "../data/products";

import "./Navbar.css";

function Navbar() {
  /* =========================================================
     STATE
  ========================================================= */

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  const accountRef = useRef(null);

  const navigate = useNavigate();

  /* =========================================================
     CONTEXT
  ========================================================= */

  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const { user,isAdmin,logout,} = useAuth();

  /* =========================================================
     COUNTS
  ========================================================= */

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const wishlistCount = wishlistItems.length;

  /* =========================================================
     CLOSE MENU
  ========================================================= */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =========================================================
     CLOSE ACCOUNT
  ========================================================= */

  const closeAccount = () => {
    setAccountOpen(false);
  };

  /* =========================================================
     ACCOUNT NAVIGATION
  ========================================================= */

  const handleAccountNavigation = (path) => {
    setAccountOpen(false);
    setMenuOpen(false);
    setSearchOpen(false);

    navigate(path);
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await logout();

      setAccountOpen(false);
      setMenuOpen(false);

      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /* =========================================================
     CLOSE ACCOUNT WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
  };

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return false;
    }

    return (
      product.name
        ?.toLowerCase()
        .includes(search) ||
      product.category
        ?.toLowerCase()
        .includes(search) ||
      product.description
        ?.toLowerCase()
        .includes(search)
    );
  });

  /* =========================================================
     POPULAR SEARCHES
  ========================================================= */

  const popularSearches = [
    "Bangles",
    "Earrings",
    "Hair Clips",
    "Rings",
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* =====================================================
          ANNOUNCEMENT
      ===================================================== */}

      <div className="announcement">
        Free shipping on orders above ₹999
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">
        <div className="nav-container">

          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setAccountOpen(false);
            }}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            className="logo"
            onClick={() => {
              closeMenu();
              closeAccount();
            }}
          >
            <Sparkles size={17} />
            LUMORA
          </Link>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <nav
            className={`nav-links ${
              menuOpen ? "open" : ""
            }`}
          >
            <Link
              to="/"
              onClick={closeMenu}
            >
              Home
            </Link>

            <Link
              to="/shop"
              onClick={closeMenu}
            >
              Shop
            </Link>

            {isAdmin && (
            <Link
                to="/admin"
                className="admin-nav-link"
                onClick={closeMenu}
            >
                <LayoutDashboard size={16} />
                Admin
            </Link>
            )}

            <Link
              to="/shop?category=Bangles"
              onClick={closeMenu}
            >
              Bangles
            </Link>

            <Link
              to="/shop?category=Earrings"
              onClick={closeMenu}
            >
              Earrings
            </Link>

            <Link
              to="/shop?category=Hair Clips"
              onClick={closeMenu}
            >
              Hair Clips
            </Link>

            <Link
              to="/shop?category=Rings"
              onClick={closeMenu}
            >
              Rings
            </Link>
          </nav>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="nav-actions">

            {/* =================================================
                SEARCH
            ================================================= */}

            <button
              type="button"
              className="nav-action-button"
              onClick={() => {
                setSearchOpen(true);
                setAccountOpen(false);
                setMenuOpen(false);
              }}
              aria-label="Search"
            >
              <Search size={22} />
            </button>

            {/* =================================================
                WISHLIST
            ================================================= */}

            <button
              type="button"
              className="nav-action-button wishlist-icon"
              onClick={() => {
                closeAccount();
                setSearchOpen(false);
                navigate("/wishlist");
              }}
              aria-label="Wishlist"
            >
              <Heart size={22} />

              {wishlistCount > 0 && (
                <span className="wishlist-count">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* =================================================
                ACCOUNT
            ================================================= */}

            <div
              className="account-menu-wrapper"
              ref={accountRef}
            >
              <button
                type="button"
                className="nav-action-button account-icon"
                onClick={() => {
                  setAccountOpen((prev) => !prev);
                  setSearchOpen(false);
                  setMenuOpen(false);
                }}
                aria-label="My Account"
                aria-expanded={accountOpen}
              >
                <UserRound size={22} />
              </button>

              {/* =================================================
                  ACCOUNT DROPDOWN
              ================================================= */}

              {accountOpen && (
                <div className="account-dropdown">

                  {/* =================================================
                      ACCOUNT HEADER
                  ================================================= */}

                  <div className="account-header">

                    <div className="account-avatar">
                      <UserRound size={19} />
                    </div>

                    <div className="account-header-content">

                      <div className="account-title">
                        {user
                          ? `Hi, ${
                              user.displayName ||
                              "Customer"
                            }`
                          : "Welcome to LUMORA"}
                      </div>

                      <div className="account-subtitle">
                        {user
                          ? user.email
                          : "Sign in to manage your account"}
                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      GUEST USER
                  ================================================= */}

                  {!user && (
                    <>
                      {/* LOGIN */}

                      <button
                        type="button"
                        className="account-menu-item"
                        onClick={() =>
                          handleAccountNavigation(
                            "/login"
                          )
                        }
                      >
                        <div className="account-item-icon">
                          <UserRound size={18} />
                        </div>

                        <div className="account-item-content">
                          <div className="account-item-title">
                            Login
                          </div>

                          <div className="account-item-description">
                            Sign in to your account
                          </div>
                        </div>

                        <div className="account-item-arrow">
                          <ArrowRight size={17} />
                        </div>
                      </button>

                      {/* REGISTER */}

                      <button
                        type="button"
                        className="account-menu-item"
                        onClick={() =>
                          handleAccountNavigation(
                            "/register"
                          )
                        }
                      >
                        <div className="account-item-icon">
                          <Sparkles size={18} />
                        </div>

                        <div className="account-item-content">
                          <div className="account-item-title">
                            Create Account
                          </div>

                          <div className="account-item-description">
                            Join the LUMORA family
                          </div>
                        </div>

                        <div className="account-item-arrow">
                          <ArrowRight size={17} />
                        </div>
                      </button>
                    </>
                  )}

                  {/* =================================================
                      LOGGED-IN USER
                  ================================================= */}

                  {user && (
                    <>

                    {/* Admin ORDERS */}

                    {isAdmin && (
                        <button
                            type="button"
                            className="account-menu-item"
                            onClick={() =>
                            handleAccountNavigation("/admin/orders")
                            }
                        >
                            <div className="account-item-icon">
                            <Package size={18} />
                            </div>

                            <div className="account-item-content">
                            <div className="account-item-title">
                                Admin Orders
                            </div>

                            <div className="account-item-description">
                                Manage customer orders
                            </div>
                            </div>

                            <div className="account-item-arrow">
                            <ArrowRight size={17} />
                            </div>
                        </button>
                        )}


                        {/* MY ACCOUNT */}

                        <button
                            type="button"
                            className="account-menu-item"
                            onClick={() =>
                                handleAccountNavigation("/account")
                            }
                            >
                            <div className="account-item-icon">
                                <UserRound size={18} />
                            </div>

                            <div className="account-item-content">
                                <div className="account-item-title">
                                My Account
                                </div>

                                <div className="account-item-description">
                                Manage your account
                                </div>
                            </div>

                            <div className="account-item-arrow">
                                <ArrowRight size={17} />
                            </div>
                        </button>


                      {/* MY ORDERS */}

                      <button
                        type="button"
                        className="account-menu-item"
                        onClick={() =>
                          handleAccountNavigation(
                            "/orders"
                          )
                        }
                      >
                        <div className="account-item-icon">
                          <Package size={18} />
                        </div>

                        <div className="account-item-content">
                          <div className="account-item-title">
                            My Orders
                          </div>

                          <div className="account-item-description">
                            View your orders
                          </div>
                        </div>

                        <div className="account-item-arrow">
                          <ArrowRight size={17} />
                        </div>
                      </button>

                      {/* WISHLIST */}

                      <button
                        type="button"
                        className="account-menu-item"
                        onClick={() =>
                          handleAccountNavigation(
                            "/wishlist"
                          )
                        }
                      >
                        <div className="account-item-icon">
                          <Heart size={18} />
                        </div>

                        <div className="account-item-content">
                          <div className="account-item-title">
                            Wishlist
                          </div>

                          <div className="account-item-description">
                            Your saved products
                          </div>
                        </div>

                        <div className="account-item-arrow">
                          <ArrowRight size={17} />
                        </div>
                      </button>

                      {/* LOGOUT */}

                      <button
                        type="button"
                        className="account-menu-item account-logout"
                        onClick={handleLogout}
                      >
                        <div className="account-item-icon">
                          <LogOut size={18} />
                        </div>

                        <div className="account-item-content">
                          <div className="account-item-title">
                            Logout
                          </div>

                          <div className="account-item-description">
                            Sign out of your account
                          </div>
                        </div>
                      </button>
                    </>
                  )}

                </div>
              )}
            </div>

            {/* =================================================
                CART
            ================================================= */}

            <button
              type="button"
              className="nav-action-button cart-icon"
              onClick={() => {
                closeAccount();
                setSearchOpen(false);
                navigate("/cart");
              }}
              aria-label="Shopping cart"
            >
              <ShoppingBag size={22} />

              {cartCount > 0 && (
                <span className="cart-count">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* =====================================================
          SEARCH OVERLAY
      ===================================================== */}

      {searchOpen && (
        <div
          className="search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeSearch();
            }
          }}
        >
          <div className="search-box">

            {/* =================================================
                SEARCH HEADER
            ================================================= */}

            <div className="search-header">

              <div className="search-input-wrapper">

                <Search size={20} />

                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) =>
                    handleSearch(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      filteredProducts.length > 0
                    ) {
                      navigate(
                        `/product/${filteredProducts[0].id}`
                      );

                      closeSearch();
                    }

                    if (e.key === "Escape") {
                      closeSearch();
                    }
                  }}
                  placeholder="Search for products..."
                />

                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <X size={17} />
                  </button>
                )}

              </div>

              <button
                type="button"
                className="search-close"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <X size={19} />
              </button>

            </div>

            {/* =================================================
                SEARCH CONTENT
            ================================================= */}

            <div className="search-content">

              {/* =================================================
                  NO SEARCH YET
              ================================================= */}

              {!searchTerm && (
                <div className="search-empty">

                  <div className="search-empty-icon">
                    <Search size={26} />
                  </div>

                  <h3>
                    What are you looking for?
                  </h3>

                  <p>
                    Search our collection of beautiful
                    accessories.
                  </p>

                  <div className="popular-searches">

                    <span>
                      Popular Searches
                    </span>

                    <div className="popular-search-buttons">
                      {popularSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setSearchTerm(item)
                          }
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                  </div>
                </div>
              )}

              {/* =================================================
                  SEARCH RESULTS
              ================================================= */}

              {searchTerm &&
                filteredProducts.length > 0 && (
                  <div className="search-results">

                    <div className="search-results-header">

                      <h3>
                        Search Results
                      </h3>

                      <span>
                        {filteredProducts.length} product
                        {filteredProducts.length !== 1
                          ? "s"
                          : ""}
                      </span>

                    </div>

                    <div className="search-results-list">

                      {filteredProducts.map(
                        (product) => (
                          <button
                            type="button"
                            className="search-product"
                            key={product.id}
                            onClick={() => {
                              navigate(
                                `/product/${product.id}`
                              );

                              closeSearch();
                            }}
                          >
                            <div className="search-product-image">
                              <img
                                src={product.image}
                                alt={product.name}
                              />
                            </div>

                            <div className="search-product-info">

                              <span>
                                {product.category}
                              </span>

                              <h3>
                                {product.name}
                              </h3>

                              <strong>
                                ₹
                                {Number(
                                  product.price
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </strong>

                            </div>

                            <div className="search-product-arrow">
                              <ChevronRight size={19} />
                            </div>

                          </button>
                        )
                      )}

                    </div>
                  </div>
                )}

              {/* =================================================
                  NO RESULTS
              ================================================= */}

              {searchTerm &&
                filteredProducts.length === 0 && (
                  <div className="search-empty">

                    <div className="search-empty-icon">
                      <Search size={26} />
                    </div>

                    <h3>
                      No products found
                    </h3>

                    <p>
                      We couldn't find anything matching "
                      {searchTerm}".
                    </p>

                    <button
                      type="button"
                      className="search-browse-button"
                      onClick={() => {
                        navigate("/shop");
                        closeSearch();
                      }}
                    >
                      Browse All Products
                    </button>

                  </div>
                )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;