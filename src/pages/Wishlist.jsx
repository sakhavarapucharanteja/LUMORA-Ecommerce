import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

import Navbar from "../components/Navbar";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

import "./Wishlist.css";

function Wishlist() {
  const {
    wishlistItems,
    removeFromWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  return (
    <div className="wishlist-page">
      <Navbar />

      <main className="wishlist-container">
        <div className="wishlist-header">
          <div>
            <p className="eyebrow">YOUR FAVORITES</p>
            <h1>My Wishlist</h1>
          </div>

          <span className="wishlist-count">
            {wishlistItems.length}{" "}
            {wishlistItems.length === 1
              ? "Item"
              : "Items"}
          </span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon">
              <Heart size={40} />
            </div>

            <h2>Your wishlist is empty</h2>

            <p>
              Save your favorite accessories here and
              come back to them anytime.
            </p>

            <Link
              to="/shop"
              className="wishlist-shop-button"
            >
              <ShoppingBag size={18} />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((product) => (
              <div
                className="wishlist-card"
                key={product.id}
              >
                <div className="wishlist-image">
                  <Link
                    to={`/product/${product.id}`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                  </Link>

                  <button
                    className="wishlist-remove"
                    onClick={() =>
                      removeFromWishlist(product.id)
                    }
                    aria-label={`Remove ${product.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="wishlist-info">
                  <p className="product-category">
                    {product.category ||
                      "ACCESSORIES"}
                  </p>

                  <Link
                    to={`/product/${product.id}`}
                    className="wishlist-product-name"
                  >
                    <h3>{product.name}</h3>
                  </Link>

                  <div className="wishlist-price">
                    <strong>
                      ₹
                      {product.price.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    {product.oldPrice && (
                      <del>
                        ₹
                        {product.oldPrice.toLocaleString(
                          "en-IN"
                        )}
                      </del>
                    )}
                  </div>

                  <button
                    className="wishlist-cart-button"
                    onClick={() =>
                      handleAddToCart(product)
                    }
                  >
                    <ShoppingBag size={17} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Wishlist;