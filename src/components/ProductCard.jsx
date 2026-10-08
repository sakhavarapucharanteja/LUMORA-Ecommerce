import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import "./ProductCard.css";

import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const liked = isInWishlist(product.id);

  // =========================
  // STOCK
  // =========================

  const stockQuantity = Number(
    product.stock ?? 0
  );

  const isOutOfStock =
    stockQuantity <= 0;


  // =========================
  // WISHLIST
  // =========================

  const handleWishlist = (e) => {
    // Prevent the product card/link from opening
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist(product);
  };


  // =========================
  // ADD TO CART
  // =========================

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    addToCart(product, 1);
  };


  return (
    <div className="product-card">

      {/* =========================
          PRODUCT IMAGE
      ========================= */}

      <div className="product-image">

        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
          />
        </Link>


        {/* =========================
            WISHLIST
        ========================= */}

        <button
          type="button"
          className={`heart-btn ${
            liked ? "liked" : ""
          }`}
          onClick={handleWishlist}
          aria-label={
            liked
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
        >
          <Heart
            size={19}
            fill={
              liked
                ? "currentColor"
                : "none"
            }
          />
        </button>


        {/* =========================
            SALE
        ========================= */}

        {product.oldPrice &&
          Number(product.oldPrice) >
            Number(product.price) && (
            <span className="sale-badge">
              SALE
            </span>
          )}

      </div>


      {/* =========================
          PRODUCT INFORMATION
      ========================= */}

      <div className="product-info">

        <p className="product-category">
          {product.category ||
            "ACCESSORIES"}
        </p>


        <Link
          to={`/product/${product.id}`}
          className="product-title-link"
        >
          <h3>
            {product.name}
          </h3>
        </Link>


        {/* =========================
            PRICE
        ========================= */}

        <div className="price">

          <strong>
            ₹
            {Number(
              product.price || 0
            ).toLocaleString("en-IN")}
          </strong>

          {product.oldPrice && (
            <del>
              ₹
              {Number(
                product.oldPrice
              ).toLocaleString("en-IN")}
            </del>
          )}

        </div>


        {/* =========================
            STOCK STATUS
        ========================= */}

        <div
          className={`product-stock ${
            isOutOfStock
              ? "product-stock-out"
              : "product-stock-in"
          }`}
        >

          <span className="product-stock-dot" />

          {isOutOfStock ? (
            "Out of Stock"
          ) : (
            `In Stock`
          )}

        </div>


        {/* =========================
            ADD TO CART
        ========================= */}

        <button
          type="button"
          className={`add-cart ${
            isOutOfStock
              ? "add-cart-disabled"
              : ""
          }`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {isOutOfStock
            ? "Out of Stock"
            : "Add to Cart"}
        </button>

      </div>

    </div>
  );
}

export default ProductCard;