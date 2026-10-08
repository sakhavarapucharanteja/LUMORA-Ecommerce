import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

import {
  RecaptchaVerifier,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import { useAuth } from "../context/AuthContext";

import { auth, db } from "../firebase/firebase";

import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const {
    register,
    linkPhoneNumber,
  } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [otpSent, setOtpSent] =
    useState(false);

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] =
    useState(false);

  const recaptchaVerifierRef =
    useRef(null);

  const createdUserRef =
    useRef(null);

  // -----------------------------
  // CLEANUP
  // -----------------------------

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // -----------------------------
  // PHONE NORMALIZER
  // -----------------------------

  const normalizePhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 10) {
      return `+91${digits}`;
    }

    if (
      value.trim().startsWith("+") &&
      digits.length >= 10
    ) {
      return `+${digits}`;
    }

    return "";
  };

  // -----------------------------
  // CHANGE
  // -----------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // -----------------------------
  // RECAPTCHA
  // -----------------------------

  const getRecaptchaVerifier = () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const verifier = new RecaptchaVerifier(
      auth,
      "register-recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log(
            "Registration reCAPTCHA completed"
          );
        },
        "expired-callback": () => {
          console.log(
            "Registration reCAPTCHA expired"
          );
        },
      }
    );

    recaptchaVerifierRef.current =
      verifier;

    return verifier;
  };

  // -----------------------------
  // CREATE ACCOUNT + SEND OTP
  // -----------------------------

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const name =
      formData.name.trim();

    const email =
      formData.email.trim();

    const phoneNumber =
      normalizePhoneNumber(
        formData.phone
      );

    if (
      !name ||
      !email ||
      !formData.phone ||
      !formData.password
    ) {
      setError(
        "Please fill in all required fields."
      );
      return;
    }

    if (!phoneNumber) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (
      formData.password.length < 6
    ) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      // Create email/password account
      const newUser = await register(
        name,
        email,
        formData.password
      );

      createdUserRef.current =
        newUser;

      // Create reCAPTCHA
      const verifier =
        getRecaptchaVerifier();

      // Send OTP and link phone
      const result =
        await linkPhoneNumber(
          newUser,
          phoneNumber,
          verifier
        );

      setConfirmationResult(result);
      setOtpSent(true);

      setMessage(
        `OTP sent to ${phoneNumber}`
      );
    } catch (error) {
      console.error(error);

      if (
        recaptchaVerifierRef.current
      ) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current =
          null;
      }

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "An account already exists with this email."
        );
      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        error.code ===
        "auth/weak-password"
      ) {
        setError(
          "Please choose a stronger password."
        );
      } else if (
        error.code ===
        "auth/invalid-phone-number"
      ) {
        setError(
          "Please enter a valid mobile number."
        );
      } else if (
        error.code ===
        "auth/credential-already-in-use"
      ) {
        setError(
          "This mobile number is already connected to another account."
        );
      } else if (
        error.code ===
        "auth/provider-already-linked"
      ) {
        setError(
          "This mobile number is already linked to your account."
        );
      } else {
        setError(
          "Unable to create your account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // VERIFY REGISTRATION OTP
  // -----------------------------

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!confirmationResult) {
      setError(
        "Please request an OTP first."
      );
      return;
    }

    if (!formData.otp.trim()) {
      setError(
        "Please enter the OTP."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await confirmationResult.confirm(
          formData.otp.trim()
        );

      const verifiedUser =
        result.user;

      // Save customer profile
      await setDoc(
        doc(
          db,
          "users",
          verifiedUser.uid
        ),
        {
          name:
            formData.name.trim(),
          email:
            verifiedUser.email || "",
          phone:
            verifiedUser.phoneNumber || "",
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      if (
        error.code ===
        "auth/invalid-verification-code"
      ) {
        setError(
          "Invalid OTP. Please check the code."
        );
      } else if (
        error.code ===
        "auth/code-expired"
      ) {
        setError(
          "OTP expired. Please request a new one."
        );
      } else {
        setError(
          "Unable to verify OTP. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-container">

        {/* BRAND */}

        <div className="auth-brand">

          <Link
            to="/"
            className="auth-back"
          >
            <ArrowLeft size={17} />
            Back to LUMORA
          </Link>

          <div className="auth-brand-content">

            <div className="auth-logo">
              <Sparkles size={18} />
              LUMORA
            </div>

            <h1>
              Join
              <br />
              LUMORA
            </h1>

            <p>
              Create your account and
              discover beautiful
              accessories made for
              your style.
            </p>

          </div>

        </div>

        {/* REGISTER */}

        <div className="auth-form-section">

          <div className="auth-form-wrapper">

            <div className="auth-mobile-logo">
              <Sparkles size={17} />
              LUMORA
            </div>

            <div className="auth-heading">

              <span className="auth-eyebrow">
                Create account
              </span>

              <h2>
                Create your account
              </h2>

              <p>
                Join LUMORA to save your
                wishlist and manage your
                orders.
              </p>

            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {message && (
              <div className="auth-success">
                {message}
              </div>
            )}

            {!otpSent ? (
              <form
                className="auth-form"
                onSubmit={
                  handleCreateAccount
                }
              >

                {/* NAME */}

                <div className="auth-field">

                  <label htmlFor="name">
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    autoComplete="name"
                    disabled={loading}
                  />

                </div>

                {/* EMAIL */}

                <div className="auth-field">

                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                  />

                </div>

                {/* PHONE */}

                <div className="auth-field">

                  <label htmlFor="phone">
                    Mobile Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit mobile number"
                    autoComplete="tel"
                    maxLength={10}
                    disabled={loading}
                  />

                  <small className="phone-help">
                    We'll verify this number
                    with an OTP.
                  </small>

                </div>

                {/* PASSWORD */}

                <div className="auth-field">

                  <label htmlFor="password">
                    Password
                  </label>

                  <div className="password-wrapper">

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.password
                      }
                      onChange={handleChange}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

                {/* CONFIRM PASSWORD */}

                <div className="auth-field">

                  <label htmlFor="confirmPassword">
                    Confirm Password
                  </label>

                  <div className="password-wrapper">

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.confirmPassword
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) =>
                            !prev
                        )
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Sending OTP..."
                    : "Continue"}
                </button>

              </form>
            ) : (
              <form
                className="auth-form"
                onSubmit={
                  handleVerifyOtp
                }
              >

                <div className="auth-field">

                  <label htmlFor="otp">
                    Verification Code
                  </label>

                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={loading}
                  />

                </div>

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Verifying..."
                    : "Verify & Create Account"}
                </button>

              </form>
            )}

            <div
              id="register-recaptcha-container"
            ></div>

            <div className="auth-switch">

              <span>
                Already have an account?
              </span>

              <Link to="/login">
                Sign In
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;