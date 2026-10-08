import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ChevronRight,
  Heart,
  Sparkles,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import "../App.css";
import { db } from "../firebase/firebase";

import Navbar from "../components/Navbar";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";


/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  {
    name: "Bangles",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d",
  },
  {
    name: "Earrings",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908",
  },
  {
    name: "Hair Clips",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  },
  {
    name: "Rings",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e",
  },
];


/* =========================================================
   HOME
========================================================= */

function Home() {
  const { addToCart } = useCart();

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);


  /* =======================================================
     LOAD PRODUCTS FROM FIRESTORE
  ======================================================= */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(
          collection(db, "products")
        );

        const productList = snapshot.docs.map((productDoc) => ({
          id: productDoc.id,
          ...productDoc.data(),
        }));

        setProducts(productList);

      } catch (error) {
        console.error(
          "Error loading home products:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);


  /* =======================================================
     ADD TO CART
  ======================================================= */

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="app">

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <Navbar />


      {/* ==================================================
          HERO
      ================================================== */}

      <section className="hero" id="home">

        <div className="hero-content">

          <p className="hero-small">
            NEW COLLECTION 2026
          </p>

          <h1>
            Beauty in
            <br />
            <i>Every Detail.</i>
          </h1>

          <p className="hero-description">
            Discover beautiful accessories designed to
            add a little sparkle to every moment.
          </p>

          <Link
            to="/shop"
            className="primary-btn"
          >
            Shop Collection
            <ChevronRight size={18} />
          </Link>

        </div>


        <div className="hero-image">

          <img
            src="https://images.unsplash.com/photo-1617038220319-276d3cfab638"
            alt="Fashion jewellery"
          />

        </div>

      </section>


      {/* ==================================================
          CATEGORIES
      ================================================== */}

      <section
        className="section"
        id="categories"
      >

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              EXPLORE
            </p>

            <h2>
              Shop by Category
            </h2>

          </div>

          <Link to="/shop">
            View all
            <ChevronRight size={16} />
          </Link>

        </div>


        <div className="category-grid">

          {categories.map((category) => (

            <Link
              to={`/shop?category=${encodeURIComponent(
                category.name
              )}`}
              className="category-card"
              key={category.name}
            >

              <img
                src={category.image}
                alt={category.name}
              />

              <div className="category-overlay">

                <h3>
                  {category.name}
                </h3>

                <span>
                  Shop now →
                </span>

              </div>

            </Link>

          ))}

        </div>

      </section>


      {/* ==================================================
          TRENDING PRODUCTS
      ================================================== */}

      <section
        className="section products-section"
        id="shop"
      >

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              CURATED FOR YOU
            </p>

            <h2>
              Trending Now
            </h2>

          </div>

          <Link to="/shop">
            Shop all
            <ChevronRight size={16} />
          </Link>

        </div>


        {loading ? (

          <div className="no-products">

            <h2>
              Loading products...
            </h2>

            <p>
              Please wait while we load our
              collection.
            </p>

          </div>

        ) : products.length === 0 ? (

          <div className="no-products">

            <h2>
              No products found
            </h2>

            <p>
              Our collection is currently empty.
            </p>

          </div>

        ) : (

          <div className="product-grid">

            {products.map((product) => (

              <div
                className="product-card"
                key={product.id}
              >

                {/* PRODUCT IMAGE */}

                <div className="product-image">

                  <Link
                    to={`/product/${product.id}`}
                  >

                    <img
                      src={product.image}
                      alt={product.name}
                    />

                  </Link>


                  {/* WISHLIST */}

                  <button
                    className={`heart-btn ${
                      isInWishlist(product.id)
                        ? "liked"
                        : ""
                    }`}
                    type="button"
                    aria-label={
                      isInWishlist(product.id)
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    onClick={() =>
                      toggleWishlist(product)
                    }
                  >

                    <Heart
                      size={19}
                      fill={
                        isInWishlist(product.id)
                          ? "currentColor"
                          : "none"
                      }
                    />

                  </button>


                  <span className="sale-badge">
                    SALE
                  </span>

                </div>


                {/* PRODUCT INFO */}

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


                  <div className="price">

                    <strong>
                      ₹
                      {Number(
                        product.price
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


                  <button
                    className="add-cart"
                    type="button"
                    onClick={() =>
                      handleAddToCart(product)
                    }
                  >
                    Add to Cart
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* ==================================================
          OFFER BANNER
      ================================================== */}

      <section
        className="offer"
        id="offers"
      >

        <div>

          <p>
            LIMITED TIME OFFER
          </p>

          <h2>
            Make it sparkle.
          </h2>

          <span>
            Get up to 30% off on selected accessories.
          </span>

        </div>


        <Link
          to="/shop"
          className="offer-btn"
        >
          Shop Offers
        </Link>

      </section>


      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer
        className="lumora-footer"
        id="contact"
      >

        {/* ================= MAIN FOOTER ================= */}

        <div className="footer-main">


          {/* BRAND */}

          <div className="footer-brand">

            <div className="footer-logo">

              <Sparkles
                size={18}
                strokeWidth={1.8}
              />

              <span>
                LUMORA
              </span>

            </div>


            <p>
              Beautiful accessories for every
              version of you. Discover elegant
              pieces designed to make every
              moment sparkle.
            </p>


            {/* SOCIAL */}

            <div className="footer-socials">

              <a
                href="#"
                aria-label="Instagram"
              >
                IG
              </a>

              <a
                href="#"
                aria-label="Facebook"
              >
                FB
              </a>

            </div>

          </div>


          {/* SHOP */}

          <div className="footer-column">

            <h4>
              SHOP
            </h4>

            <Link to="/shop">
              All Products
            </Link>

            <Link to="/shop?category=Bangles">
              Bangles
            </Link>

            <Link to="/shop?category=Earrings">
              Earrings
            </Link>

            <Link to="/shop?category=Hair Clips">
              Hair Clips
            </Link>

            <Link to="/shop?category=Rings">
              Rings
            </Link>

          </div>


          {/* HELP */}

          <div className="footer-column">

            <h4>
              HELP
            </h4>

            <Link to="/account">
              My Account
            </Link>

            <Link to="/orders">
              My Orders
            </Link>

            <Link to="/wishlist">
              Wishlist
            </Link>

            <a href="#contact">
              Contact Us
            </a>

            <a href="#faq">
              FAQs
            </a>

          </div>


          {/* CONTACT */}

          <div className="footer-column footer-contact">

            <h4>
              CONTACT
            </h4>


            <p>

              <Mail size={16} />

              <span>
                support@lumora.in
              </span>

            </p>


            <p>

              <Phone size={16} />

              <span>
                +91 XXXXX XXXXX
              </span>

            </p>


            <p>

              <MapPin size={16} />

              <span>
                Hyderabad, Telangana, India
              </span>

            </p>

          </div>

        </div>


        {/* ================= NEWSLETTER ================= */}

        <div className="footer-newsletter">

          <div>

            <h3>
              Stay in the sparkle ✨
            </h3>

            <p>
              Get updates on new arrivals,
              exclusive offers and more.
            </p>

          </div>


          <form
            className="newsletter-form"
            onSubmit={(e) => e.preventDefault()}
          >

            <input
              type="email"
              placeholder="Enter your email address"
              aria-label="Email address"
            />

            <button
              type="submit"
            >
              Subscribe
            </button>

          </form>

        </div>


        {/* ================= BOTTOM ================= */}

        <div className="footer-bottom">

          <div className="footer-copyright">
            © 2026 LUMORA. All rights reserved.
          </div>


          <div className="footer-policies">

            <a href="#">
              Privacy Policy
            </a>

            <a href="#">
              Terms & Conditions
            </a>

            <a href="#">
              Shipping & Returns
            </a>

          </div>

        </div>

      </footer>

    </div>
  );
}


export default Home;