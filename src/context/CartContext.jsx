import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // =========================
  // Load Cart
  // =========================

  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem("lumora-cart");

      if (!savedCart) {
        return [];
      }

      const parsedCart =
        JSON.parse(savedCart);

      // Make sure saved data is an array
      if (!Array.isArray(parsedCart)) {
        return [];
      }

      // =========================
      // Correct saved quantities
      // according to stock
      // =========================

      return parsedCart
        .map((item) => {
          if (!item) {
            return null;
          }

          const stock = Number(item.stock);

          // If stock exists, make sure
          // quantity does not exceed stock
          if (
            Number.isFinite(stock) &&
            stock >= 0
          ) {
            // Product is out of stock
            if (stock === 0) {
              return null;
            }

            return {
              ...item,
              quantity: Math.min(
                Number(item.quantity) || 1,
                stock
              ),
            };
          }

          // Legacy cart item without stock
          return {
            ...item,
            quantity:
              Number(item.quantity) || 1,
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error
      );

      return [];
    }
  });

  // =========================
  // Save Cart
  // =========================

  useEffect(() => {
    try {
      localStorage.setItem(
        "lumora-cart",
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error
      );
    }
  }, [cartItems]);

  // =========================
  // Add To Cart
  // =========================

  const addToCart = (
    product,
    quantity = 1
  ) => {
    if (!product || !product.id) {
      console.error(
        "Invalid product:",
        product
      );

      return;
    }

    if (quantity <= 0) {
      return;
    }

    const stock = Number(product.stock);

    // =========================
    // Product is out of stock
    // =========================

    if (
      Number.isFinite(stock) &&
      stock <= 0
    ) {
      console.warn(
        "Product is out of stock:",
        product.name
      );

      return;
    }

    setCartItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            String(item.id) ===
            String(product.id)
        );

      // =========================
      // Product already exists
      // =========================

      if (existingItem) {
        let newQuantity =
          Number(existingItem.quantity) +
          Number(quantity);

        // Never exceed stock
        if (
          Number.isFinite(stock) &&
          stock >= 0
        ) {
          newQuantity = Math.min(
            newQuantity,
            stock
          );
        }

        return currentItems.map(
          (item) =>
            String(item.id) ===
            String(product.id)
              ? {
                  ...item,
                  ...product,
                  quantity:
                    newQuantity,
                }
              : item
        );
      }

      // =========================
      // New product
      // =========================

      let newQuantity =
        Number(quantity);

      // Never exceed stock
      if (
        Number.isFinite(stock) &&
        stock >= 0
      ) {
        newQuantity = Math.min(
          newQuantity,
          stock
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: newQuantity,
        },
      ];
    });
  };

  // =========================
  // Remove From Cart
  // =========================

  const removeFromCart = (
    productId
  ) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) =>
          String(item.id) !==
          String(productId)
      )
    );
  };

  // =========================
  // Update Quantity
  // =========================

  const updateQuantity = (
    productId,
    quantity
  ) => {
    const requestedQuantity =
      Number(quantity);

    // Remove item if quantity
    // becomes zero or invalid
    if (
      !Number.isFinite(
        requestedQuantity
      ) ||
      requestedQuantity <= 0
    ) {
      removeFromCart(productId);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (
          String(item.id) !==
          String(productId)
        ) {
          return item;
        }

        const stock = Number(
          item.stock
        );

        let finalQuantity =
          requestedQuantity;

        // =========================
        // Respect stock limit
        // =========================

        if (
          Number.isFinite(stock) &&
          stock >= 0
        ) {
          // If no stock
          if (stock === 0) {
            return null;
          }

          finalQuantity =
            Math.min(
              requestedQuantity,
              stock
            );
        }

        return {
          ...item,
          quantity:
            finalQuantity,
        };
      })
      .filter(Boolean)
    );
  };

  // =========================
  // Clear Cart
  // =========================

  const clearCart = () => {
    setCartItems([]);

    // Immediately remove saved cart
    localStorage.removeItem(
      "lumora-cart"
    );
  };

  // =========================
  // Cart Count
  // =========================

  const cartCount =
    cartItems.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  // =========================
  // Cart Total
  // =========================

  const cartTotal =
    cartItems.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );

  // =========================
  // Context
  // =========================

  const value = {
    cartItems,
    cartCount,
    cartTotal,

    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

// =========================
// useCart Hook
// =========================

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider"
    );
  }

  return context;
}