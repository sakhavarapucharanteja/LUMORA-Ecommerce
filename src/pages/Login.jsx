import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Smartphone,
  Mail,
} from "lucide-react";

import {
  RecaptchaVerifier,
} from "firebase/auth";

import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/firebase";

import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    sendPhoneOtp,
  } = useAuth();

  const [loginMethod, setLoginMethod] =
    useState("email");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    otp: "",
  });

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [otpSent, setOtpSent] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const recaptchaVerifierRef = useRef(null);

  const redirectTo =
    location.state?.from || "/";

  // -----------------------------
  // CLEANUP RECAPTCHA
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
  // NORMALIZE PHONE
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
  // FORM CHANGE
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
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA completed");
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired");
        },
      }
    );

    recaptchaVerifierRef.current = verifier;

    return verifier;
  };

  // -----------------------------
  // EMAIL LOGIN
  // -----------------------------

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !formData.email ||
      !formData.password
    ) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      await login(
        formData.email.trim(),
        formData.password
      );

      navigate(redirectTo, {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        setError(
          "Incorrect email or password."
        );
      } else if (
        error.code ===
        "auth/user-not-found"
      ) {
        setError(
          "No account exists with this email."
        );
      } else if (
        error.code ===
        "auth/wrong-password"
      ) {
        setError(
          "Incorrect password."
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
        "auth/too-many-requests"
      ) {
        setError(
          "Too many attempts. Please try again later."
        );
      } else {
        setError(
          "Unable to sign in. Please check your details and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SEND MOBILE OTP
  // -----------------------------

  const handleSendOtp = async () => {
    setError("");
    setMessage("");

    const phoneNumber =
      normalizePhoneNumber(formData.phone);

    if (!phoneNumber) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    try {
      setLoading(true);

      const verifier =
        getRecaptchaVerifier();

      const result =
        await sendPhoneOtp(
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
        "auth/invalid-phone-number"
      ) {
        setError(
          "Please enter a valid mobile number."
        );
      } else if (
        error.code ===
        "auth/too-many-requests"
      ) {
        setError(
          "Too many attempts. Please try again later."
        );
      } else if (
        error.code ===
        "auth/quota-exceeded"
      ) {
        setError(
          "SMS limit reached. Please try again later."
        );
      } else if (
        error.code ===
        "auth/captcha-check-failed"
      ) {
        setError(
          "reCAPTCHA verification failed. Please try again."
        );
      } else {
        setError(
          "Unable to send OTP. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // VERIFY OTP
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
      setError("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);

      await confirmationResult.confirm(
        formData.otp.trim()
      );

      navigate(redirectTo, {
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

  // -----------------------------
  // SWITCH LOGIN METHOD
  // -----------------------------

  const switchLoginMethod = (method) => {
    setLoginMethod(method);

    setError("");
    setMessage("");

    setOtpSent(false);
    setConfirmationResult(null);

    setFormData((prev) => ({
      ...prev,
      otp: "",
    }));

    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
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
              Welcome
              <br />
              Back
            </h1>

            <p>
              Sign in to continue your
              LUMORA shopping experience.
            </p>

          </div>

        </div>

        {/* FORM */}

        <div className="auth-form-section">

          <div className="auth-form-wrapper">

            <div className="auth-mobile-logo">
              <Sparkles size={17} />
              LUMORA
            </div>

            <div className="auth-heading">

              <span className="auth-eyebrow">
                Welcome back
              </span>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Choose how you want to sign in.
              </p>

            </div>

            {/* LOGIN METHOD */}

            <div className="login-method-tabs">

              <button
                type="button"
                className={
                  loginMethod === "email"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  switchLoginMethod("email")
                }
              >
                <Mail size={17} />
                Email
              </button>

              <button
                type="button"
                className={
                  loginMethod === "phone"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  switchLoginMethod("phone")
                }
              >
                <Smartphone size={17} />
                Mobile
              </button>

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

            {/* EMAIL LOGIN */}

            {loginMethod === "email" && (
              <form
                className="auth-form"
                onSubmit={handleEmailLogin}
              >

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
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Signing In..."
                    : "Sign In"}
                </button>

              </form>
            )}

            {/* MOBILE LOGIN */}

            {loginMethod === "phone" && (
              <form
                className="auth-form"
                onSubmit={
                  otpSent
                    ? handleVerifyOtp
                    : (e) => {
                        e.preventDefault();
                        handleSendOtp();
                      }
                }
              >

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
                    disabled={
                      loading || otpSent
                    }
                  />

                  <small className="phone-help">
                    India (+91) mobile numbers
                    are supported.
                  </small>

                </div>

                {otpSent && (
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
                )}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading
                    ? otpSent
                      ? "Verifying..."
                      : "Sending OTP..."
                    : otpSent
                    ? "Verify OTP"
                    : "Send OTP"}
                </button>

                {otpSent && (
                  <button
                    type="button"
                    className="resend-otp-button"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}

              </form>
            )}

            {/* RECAPTCHA */}

            <div id="recaptcha-container"></div>

            <div className="auth-switch">

              <span>
                Don't have an account?
              </span>

              <Link to="/register">
                Create Account
              </Link>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;