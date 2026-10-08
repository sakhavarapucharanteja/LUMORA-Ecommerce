import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import ProductCard from "../components/ProductCard";
import Navbar from "../components/Navbar";

import "../App.css";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  const categories = [
    "All",
    "Bangles",
    "Earrings",
    "Hair Clips",
    "Rings",
  ];

  // =========================
  // LOAD PRODUCTS FROM FIRESTORE
  // =========================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(
          collection(db, "products")
        );

        const productList = snapshot.docs.map(
          (productDoc) => ({
            id: productDoc.id,
            ...productDoc.data(),
          })
        );

        setProducts(productList);
      } catch (error) {
        console.error(
          "Error loading products:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // =========================
  // FILTER + SORT
  // =========================

  const filteredProducts = useMemo(() => {
    let result =
      category === "All"
        ? [...products]
        : products.filter(
            (product) =>
              product.category === category
          );

    switch (sortBy) {
      case "price-low":
        result.sort(
          (a, b) => a.price - b.price
        );
        break;

      case "price-high":
        result.sort(
          (a, b) => b.price - a.price
        );
        break;

      case "name":
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      case "featured":
      default:
        break;
    }

    return result;
  }, [products, category, sortBy]);

  return (
    <div className="shop-page">

      {/* ==================== NAVBAR ==================== */}

      <Navbar />

      {/* ==================== SHOP HEADER ==================== */}

      <section className="shop-header">
        <p>OUR COLLECTION</p>

        <h1>Shop Accessories</h1>

        <span>
          Discover beautiful accessories made for
          every occasion.
        </span>
      </section>

      {/* ==================== SHOP CONTENT ==================== */}

      <section className="shop-content">

        {/* ==================== FILTER TOP BAR ==================== */}

        <div className="shop-filter-bar">

          {/* Categories */}

          <div className="category-filter">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {item}
              </button>
            ))}
          </div>

          {/* Sort */}

          <div className="sort-container">
            <label htmlFor="sort-products">
              Sort by
            </label>

            <select
              id="sort-products"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
            >
              <option value="featured">
                Featured
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="name">
                Name: A to Z
              </option>
            </select>
          </div>

        </div>

        {/* ==================== PRODUCT COUNT ==================== */}

        {!loading && (
          <div className="shop-count">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "Product"
              : "Products"}
          </div>
        )}

        {/* ==================== LOADING ==================== */}

        {loading ? (
          <div className="no-products">
            <h2>Loading products...</h2>

            <p>
              Please wait while we load our
              collection.
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (

          /* ==================== PRODUCTS ==================== */

          <div className="shop-product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>

        ) : (

          /* ==================== NO PRODUCTS ==================== */

          <div className="no-products">
            <h2>No products found</h2>

            <p>
              We couldn't find any products in
              this category.
            </p>

            <button
              type="button"
              onClick={() =>
                setCategory("All")
              }
            >
              View All Products
            </button>
          </div>

        )}

      </section>

    </div>
  );
}

export default Shop;