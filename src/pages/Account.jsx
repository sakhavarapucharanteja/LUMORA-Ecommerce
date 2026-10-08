import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  User,
  Package,
  Heart,
  ShoppingBag,
  LogOut,
  Lock,
  ChevronRight,
} from "lucide-react";

import { doc, getDoc, setDoc } from "firebase/firestore";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

import { db } from "../firebase/firebase";

import "./Account.css";

function Account() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();

  // =========================
  // STATE
  // =========================

  const [loggingOut, setLoggingOut] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // =========================
  // AUTH REDIRECT
  // =========================

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // =========================
  // LOAD PROFILE
  // =========================

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const profileRef = doc(db, "users", user.uid);

        const profileSnapshot = await getDoc(profileRef);

        if (profileSnapshot.exists()) {
          const data = profileSnapshot.data();

          setProfile({
            name: data.name || user.displayName || "",
            phone: data.phone || "",
          });
        } else {
          setProfile({
            name: user.displayName || "",
            phone: "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);

        setProfileMessage(
          "Unable to load your profile."
        );
      }
    };

    loadProfile();
  }, [user]);

  // =========================
  // DISPLAY NAME
  // =========================

  const displayName =
    profile.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "LUMORA Customer";

  // =========================
  // PROFILE INPUT
  // =========================

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone") {
      const numbersOnly = value
        .replace(/\D/g, "")
        .slice(0, 10);

      setProfile((previous) => ({
        ...previous,
        phone: numbersOnly,
      }));

      return;
    }

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSaveProfile = async () => {
    if (!user) return;

    const trimmedName = profile.name.trim();
    const trimmedPhone = profile.phone.trim();

    // Name validation
    if (!trimmedName) {
      setProfileMessage("Please enter your name.");
      return;
    }

    // Phone validation
    if (
      trimmedPhone &&
      !/^[0-9]{10}$/.test(trimmedPhone)
    ) {
      setProfileMessage(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    try {
      setSavingProfile(true);
      setProfileMessage("");

      const profileRef = doc(
        db,
        "users",
        user.uid
      );

      await setDoc(
        profileRef,
        {
          name: trimmedName,
          phone: trimmedPhone,
          email: user.email || "",
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      setProfile({
        name: trimmedName,
        phone: trimmedPhone,
      });

      setProfileMessage(
        "Profile updated successfully."
      );

      setEditingProfile(false);
    } catch (error) {
      console.error(
        "Error saving profile:",
        error
      );

      setProfileMessage(
        "Failed to update profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setProfileMessage("");

    // Reload saved profile
    if (user) {
      const loadSavedProfile = async () => {
        try {
          const profileRef = doc(
            db,
            "users",
            user.uid
          );

          const profileSnapshot =
            await getDoc(profileRef);

          if (profileSnapshot.exists()) {
            const data = profileSnapshot.data();

            setProfile({
              name:
                data.name ||
                user.displayName ||
                "",
              phone: data.phone || "",
            });
          }
        } catch (error) {
          console.error(
            "Error restoring profile:",
            error
          );
        }
      };

      loadSavedProfile();
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();

      navigate("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      setLoggingOut(false);
    }
  };

  // =========================
  // WAIT FOR AUTH
  // =========================

  if (!user) {
    return null;
  }

  // =========================
  // RENDER
  // =========================

  return (
    <main className="account-page">

      {/* =========================
          HEADER
      ========================= */}

      <section className="account-header">

        <div>
          <span className="account-eyebrow">
            MY LUMORA
          </span>

          <h1>My Account</h1>

          <p>
            Manage your account, orders and wishlist.
          </p>
        </div>

      </section>


      {/* =========================
          PROFILE CARD
      ========================= */}

      <section className="account-profile-card">

        <div className="account-avatar">
          <User size={28} />
        </div>

        <div className="account-profile-info">

          <span className="account-profile-label">
            WELCOME BACK
          </span>

          {!editingProfile ? (
            <>
              <h2>{displayName}</h2>

              <p>{user.email}</p>

              {profile.phone && (
                <p className="account-phone">
                  {profile.phone}
                </p>
              )}

              {profileMessage && (
                <p className="account-profile-message">
                  {profileMessage}
                </p>
              )}

              <button
                type="button"
                className="account-edit-profile-button"
                onClick={() => {
                  setProfileMessage("");
                  setEditingProfile(true);
                }}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <div className="account-profile-form">

              {/* NAME */}

              <div className="account-profile-field">

                <label htmlFor="profile-name">
                  Full Name
                </label>

                <input
                  id="profile-name"
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                  disabled={savingProfile}
                />

              </div>


              {/* PHONE */}

              <div className="account-profile-field">

                <label htmlFor="profile-phone">
                  Phone Number
                </label>

                <input
                  id="profile-phone"
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  disabled={savingProfile}
                />

              </div>


              {/* MESSAGE */}

              {profileMessage && (
                <p className="account-profile-message">
                  {profileMessage}
                </p>
              )}


              {/* ACTIONS */}

              <div className="account-profile-actions">

                <button
                  type="button"
                  className="account-profile-cancel"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="account-profile-save"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save Profile"}
                </button>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* =========================
          QUICK ACCESS
      ========================= */}

      <section className="account-section">

        <div className="account-section-heading">

          <span>QUICK ACCESS</span>

          <h2>Your LUMORA</h2>

        </div>


        <div className="account-menu-grid">

          {/* =========================
              ORDERS
          ========================= */}

          <Link
            to="/orders"
            className="account-menu-card"
          >

            <div className="account-menu-icon">
              <Package size={21} />
            </div>

            <div className="account-menu-content">

              <h3>My Orders</h3>

              <p>
                View your orders and track their status.
              </p>

            </div>

            <ChevronRight size={18} />

          </Link>


          {/* =========================
              WISHLIST
          ========================= */}

          <Link
            to="/wishlist"
            className="account-menu-card"
          >

            <div className="account-menu-icon">
              <Heart size={21} />
            </div>

            <div className="account-menu-content">

              <h3>Wishlist</h3>

              <p>
                View products you've saved.
              </p>

            </div>

            <div className="account-menu-count">
              {wishlistItems?.length || 0}
            </div>

            <ChevronRight size={18} />

          </Link>


          {/* =========================
              CART
          ========================= */}

          <Link
            to="/cart"
            className="account-menu-card"
          >

            <div className="account-menu-icon">
              <ShoppingBag size={21} />
            </div>

            <div className="account-menu-content">

              <h3>Shopping Bag</h3>

              <p>
                View the products in your cart.
              </p>

            </div>

            <div className="account-menu-count">
              {cartCount || 0}
            </div>

            <ChevronRight size={18} />

          </Link>


          {/* =========================
              SECURITY
          ========================= */}

          <div className="account-menu-card">

            <div className="account-menu-icon">
              <Lock size={21} />
            </div>

            <div className="account-menu-content">

              <h3>Account Security</h3>

              <p>
                Your account is secured with Firebase.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          LOGOUT
      ========================= */}

      <section className="account-logout-section">

        <button
          type="button"
          className="account-logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >

          <LogOut size={18} />

          {loggingOut
            ? "Logging out..."
            : "Logout"}

        </button>

      </section>

    </main>
  );
}

export default Account;