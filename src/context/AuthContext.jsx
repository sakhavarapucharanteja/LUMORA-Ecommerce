import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  linkWithPhoneNumber,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        try {
          const tokenResult = await getIdTokenResult(
            currentUser,
            true
          );

          setIsAdmin(
            tokenResult.claims.admin === true
          );
        } catch (error) {
          console.error(
            "Error checking admin role:",
            error
          );

          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  // -----------------------------
  // REGISTER
  // -----------------------------

  const register = async (
    name,
    email,
    password
  ) => {
    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await updateProfile(result.user, {
      displayName: name,
    });

    return result.user;
  };

  // -----------------------------
  // EMAIL LOGIN
  // -----------------------------

  const login = async (
    email,
    password
  ) => {
    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    try {
      const tokenResult =
        await getIdTokenResult(
          result.user,
          true
        );

      setIsAdmin(
        tokenResult.claims.admin === true
      );
    } catch (error) {
      console.error(
        "Error checking admin role after login:",
        error
      );

      setIsAdmin(false);
    }

    return result.user;
  };

  // -----------------------------
  // SEND PHONE OTP FOR LOGIN
  // -----------------------------

  const sendPhoneOtp = async (
    phoneNumber,
    appVerifier
  ) => {
    const confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

    return confirmationResult;
  };

  // -----------------------------
  // LINK PHONE TO ACCOUNT
  // -----------------------------

  const linkPhoneNumber = async (
    currentUser,
    phoneNumber,
    appVerifier
  ) => {
    const confirmationResult =
      await linkWithPhoneNumber(
        currentUser,
        phoneNumber,
        appVerifier
      );

    return confirmationResult;
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------

  const logout = async () => {
    await signOut(auth);

    setUser(null);
    setIsAdmin(false);
  };

  const value = {
    user,
    loading,
    isAdmin,

    register,
    login,

    sendPhoneOtp,
    linkPhoneNumber,

    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}