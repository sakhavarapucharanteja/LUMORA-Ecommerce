import { useEffect, useState } from "react";



import {

  Link,

  useNavigate,

  useParams,

} from "react-router-dom";



import {

  collection,

  deleteDoc,

  doc,

  getDoc,

  getDocs,

  onSnapshot,

  query,

  serverTimestamp,

  updateDoc,

  where,

  addDoc,

} from "firebase/firestore";



import { db } from "../firebase/firebase";



import { useAuth } from "../context/AuthContext";

import { useCart } from "../context/CartContext";

import { useWishlist } from "../context/WishlistContext";



import Navbar from "../components/Navbar";



import {

  Heart,

  Minus,

  Plus,

  ShoppingBag,

  ChevronRight,

  Star,

  Trash2,

  X,

  Pencil,

} from "lucide-react";



import "./ProductDetails.css";



function ProductDetails() {

  const { id } = useParams();

  const navigate = useNavigate();



  const { addToCart } = useCart();



  const {

    toggleWishlist,

    isInWishlist,

  } = useWishlist();



  const {

    user,

    isAdmin,

  } = useAuth();



  // =====================================================

  // PRODUCT STATE

  // =====================================================



  const [product, setProduct] = useState(null);

  const [productLoading, setProductLoading] = useState(true);



  const [quantity, setQuantity] = useState(1);

  const [selectedImage, setSelectedImage] = useState(0);



  // =====================================================

  // REVIEW STATE

  // =====================================================



  const [reviews, setReviews] = useState([]);



  const [showReviewForm, setShowReviewForm] =

    useState(false);



  const [reviewName, setReviewName] =

    useState("");



  const [reviewText, setReviewText] =

    useState("");



  const [reviewRating, setReviewRating] =

    useState(0);



  const [canReview, setCanReview] =

    useState(false);



  const [reviewAlreadySubmitted, setReviewAlreadySubmitted] =

    useState(false);



  const [reviewLoading, setReviewLoading] =

    useState(false);



  // =====================================================

  // EDIT REVIEW STATE

  // =====================================================



  const [editingReview, setEditingReview] =

    useState(null);



  // =====================================================

  // NOTIFICATION STATE

  // =====================================================



  const [notification, setNotification] =

    useState(null);



  // =====================================================

  // DELETE REVIEW STATE

  // =====================================================



  const [reviewToDelete, setReviewToDelete] =

    useState(null);



  const [deletingReview, setDeletingReview] =

    useState(false);



  // =====================================================

  // LOAD PRODUCT FROM FIRESTORE

  // =====================================================



  useEffect(() => {

    const loadProduct = async () => {

      try {

        setProductLoading(true);



        const productRef = doc(

          db,

          "products",

          id

        );



        const productSnapshot =

          await getDoc(productRef);



        if (productSnapshot.exists()) {

          const productData = {

            id: productSnapshot.id,

            ...productSnapshot.data(),

          };



          setProduct(productData);

        } else {

          setProduct(null);

        }

      } catch (error) {

        console.error(

          "Error loading product:",

          error

        );



        setProduct(null);

      } finally {

        setProductLoading(false);

      }

    };



    loadProduct();

  }, [id]);



  // =====================================================

  // STOCK STATE

  // Keep this hook before any conditional return so React hook order
  // remains stable between loading and loaded renders.

  // =====================================================

  const stockQuantity = Number(product?.stock ?? 0);

  const isOutOfStock = stockQuantity <= 0;

  useEffect(() => {
    setSelectedImage(0);

    setQuantity((current) => {
      if (stockQuantity <= 0) {
        return 1;
      }

      return Math.min(
        Math.max(current, 1),
        stockQuantity
      );
    });
  }, [product?.id, stockQuantity]);


  // =====================================================

  // SHOW NOTIFICATION

  // =====================================================



  const showNotification = (

    message,

    title = "LUMORA",

    type = "success"

  ) => {

    setNotification({

      message,

      title,

      type,

    });

  };



  const closeNotification = () => {

    setNotification(null);

  };



  // =====================================================

  // LOAD REVIEWS FROM FIRESTORE

  // =====================================================



  useEffect(() => {

    if (!product) {

      return;

    }



    const reviewsQuery = query(

      collection(db, "reviews"),

      where(

        "productId",

        "==",

        product.id

      )

    );



    const unsubscribe = onSnapshot(

      reviewsQuery,

      (snapshot) => {

        const loadedReviews =

          snapshot.docs.map((reviewDoc) => ({

            id: reviewDoc.id,

            ...reviewDoc.data(),

          }));



        loadedReviews.sort((a, b) => {

          const dateA =

            a.createdAt?.toDate?.() ||

            new Date(0);



          const dateB =

            b.createdAt?.toDate?.() ||

            new Date(0);



          return dateB - dateA;

        });



        setReviews(loadedReviews);

      },

      (error) => {

        console.error(

          "Error loading reviews:",

          error

        );



        showNotification(

          "Unable to load customer reviews.",

          "Reviews",

          "error"

        );

      }

    );



    return () => unsubscribe();

  }, [product]);



  // =====================================================

  // CHECK REVIEW ELIGIBILITY

  // =====================================================



  useEffect(() => {

    const checkReviewEligibility = async () => {

      if (!user || !product) {

        setCanReview(false);

        setReviewAlreadySubmitted(false);

        return;

      }



      try {

        // =================================================

        // ADMIN

        // Admin does NOT need to purchase product

        // =================================================



        if (isAdmin) {

          const adminReviewQuery = query(

            collection(db, "reviews"),

            where(

              "productId",

              "==",

              product.id

            ),

            where(

              "userId",

              "==",

              user.uid

            )

          );



          const adminReviewSnapshot =

            await getDocs(adminReviewQuery);



          const alreadyReviewed =

            !adminReviewSnapshot.empty;



          setReviewAlreadySubmitted(

            alreadyReviewed

          );



          setCanReview(!alreadyReviewed);



          return;

        }



        // =================================================

        // CUSTOMER - CHECK EXISTING REVIEW

        // =================================================



        const existingReviewQuery = query(

          collection(db, "reviews"),

          where(

            "productId",

            "==",

            product.id

          ),

          where(

            "userId",

            "==",

            user.uid

          )

        );



        const existingReviewSnapshot =

          await getDocs(existingReviewQuery);



        const alreadyReviewed =

          !existingReviewSnapshot.empty;



        setReviewAlreadySubmitted(

          alreadyReviewed

        );



        // =================================================

        // CUSTOMER - CHECK PURCHASE HISTORY

        // =================================================



        const ordersQuery = query(

          collection(db, "orders"),

          where(

            "userId",

            "==",

            user.uid

          )

        );



        const ordersSnapshot =

          await getDocs(ordersQuery);



        let purchasedProduct = false;



        ordersSnapshot.forEach(

          (orderDoc) => {

            const order =

              orderDoc.data();



            const items =

              Array.isArray(order.items)

                ? order.items

                : [];



            const hasProduct =

              items.some((item) => {

                return (

                  String(item.id) ===

                  String(product.id)

                );

              });



            if (hasProduct) {

              purchasedProduct = true;

            }

          }

        );



        setCanReview(

          purchasedProduct &&

          existingReviewSnapshot.empty

        );

      } catch (error) {

        console.error(

          "Error checking review eligibility:",

          error

        );



        setCanReview(false);

      }

    };



    checkReviewEligibility();

  }, [user, product, isAdmin]);



  // =====================================================

  // PRODUCT LOADING

  // =====================================================



  if (productLoading) {

    return (

      <div>

        <Navbar />



        <div className="product-not-found">

          <h1>Loading Product...</h1>

        </div>

      </div>

    );

  }



  // =====================================================

  // PRODUCT NOT FOUND

  // =====================================================



  if (!product) {

    return (

      <div>

        <Navbar />



        <div className="product-not-found">

          <h1>

            Product Not Found

          </h1>



          <Link to="/shop">

            Back to Shop

          </Link>

        </div>

      </div>

    );

  }



  // =====================================================

  // PRODUCT IMAGES

  // =====================================================



  const productImages =

    Array.isArray(product.images) &&

    product.images.length > 0

      ? product.images

      : product.image

        ? [product.image]

        : [];



  // =====================================================

  // WISHLIST

  // =====================================================



  const liked =

    isInWishlist(product.id);



  // =====================================================

  // REVIEW CALCULATIONS

  // =====================================================



  const reviewCount =

    reviews.length;



  const averageRating =

    reviewCount > 0

      ? (

          reviews.reduce(

            (total, review) =>

              total +

              Number(review.rating || 0),

            0

          ) / reviewCount

        ).toFixed(1)

      : null;




  // =====================================================

  // QUANTITY

  // =====================================================



  const increaseQuantity = () => {
    if (isOutOfStock) {
      return;
    }

    setQuantity((current) => {
      if (current >= stockQuantity) {
        return current;
      }

      return current + 1;
    });
  };



  const decreaseQuantity = () => {
    setQuantity((current) =>
      current > 1
        ? current - 1
        : 1
    );
  };



  // =====================================================

  // CART

  // =====================================================



  const handleAddToCart = () => {
    if (isOutOfStock) {
      showNotification(
        "This product is currently out of stock.",
        "Out of Stock",
        "error"
      );
      return;
    }

    if (quantity > stockQuantity) {
      showNotification(
        `Only ${stockQuantity} ${
          stockQuantity === 1 ? "item" : "items"
        } available.`,
        "Stock Limit",
        "error"
      );
      setQuantity(stockQuantity);
      return;
    }

    addToCart(
      product,
      quantity
    );

    showNotification(
      `${product.name} has been added to your cart.`,
      "Added to Cart",
      "success"
    );
  };



  const handleBuyNow = () => {
    if (isOutOfStock) {
      showNotification(
        "This product is currently out of stock.",
        "Out of Stock",
        "error"
      );
      return;
    }

    if (quantity > stockQuantity) {
      showNotification(
        `Only ${stockQuantity} ${
          stockQuantity === 1 ? "item" : "items"
        } available.`,
        "Stock Limit",
        "error"
      );
      setQuantity(stockQuantity);
      return;
    }

    addToCart(
      product,
      quantity
    );

    navigate("/checkout");
  };



  // =====================================================

  // WISHLIST

  // =====================================================



  const handleWishlist = () => {

    toggleWishlist(product);

  };



  // =====================================================

  // DISCOUNT

  // =====================================================



  const price =

    Number(product.price || 0);



  const oldPrice =

    Number(product.oldPrice || 0);



  const discountPercentage =

    oldPrice > price

      ? Math.round(

          ((oldPrice - price) /

            oldPrice) *

            100

        )

      : 0;



  // =====================================================

  // OPEN REVIEW FORM

  // =====================================================



  const handleOpenReviewForm = () => {

    if (!user) {

      showNotification(

        "Please login to write a review.",

        "Login Required",

        "error"

      );



      navigate("/login");

      return;

    }



    if (!canReview) {

      if (reviewAlreadySubmitted) {

        showNotification(

          "You have already reviewed this product.",

          "Review Already Submitted",

          "error"

        );



        return;

      }



      if (!isAdmin) {

        showNotification(

          "Only customers who purchased this product can submit a review.",

          "Purchase Required",

          "error"

        );



        return;

      }

    }



    setEditingReview(null);



    setReviewName(

      user.displayName ||

      ""

    );



    setReviewText("");

    setReviewRating(0);



    setShowReviewForm(

      (current) => !current

    );

  };



  // =====================================================

  // START EDIT REVIEW

  // ADMIN ONLY

  // =====================================================



  const handleEditReview = (review) => {

    if (!isAdmin) {

      return;

    }



    setEditingReview(review);



    setReviewName(

      review.name ||

      review.userName ||

      ""

    );



    setReviewText(

        review.text ||

        review.comment ||

        review.review ||

        ""

    );



    setReviewRating(

      Number(review.rating || 0)

    );



    setShowReviewForm(true);



    window.scrollTo({

      top:

        document.querySelector(

          ".customer-reviews"

        )?.offsetTop || 0,

      behavior: "smooth",

    });

  };



  // =====================================================

  // CANCEL EDIT

  // =====================================================



  const handleCancelEdit = () => {

    setEditingReview(null);

    setReviewName("");

    setReviewText("");

    setReviewRating(0);

    setShowReviewForm(false);

  };



  // =====================================================

  // SUBMIT / UPDATE REVIEW

  // =====================================================



  const handleSubmitReview = async (

    event

  ) => {

    event.preventDefault();



    if (!user) {

      showNotification(

        "Please login before submitting a review.",

        "Login Required",

        "error"

      );



      return;

    }



    if (!isAdmin && !canReview) {

      showNotification(

        "You are not eligible to review this product.",

        "Review Not Allowed",

        "error"

      );



      return;

    }



    if (!reviewName.trim()) {

      showNotification(

        "Please enter your name.",

        "Missing Information",

        "error"

      );



      return;

    }



    if (reviewRating === 0) {

      showNotification(

        "Please select a rating.",

        "Missing Rating",

        "error"

      );



      return;

    }



    if (!reviewText.trim()) {

      showNotification(

        "Please write your review.",

        "Missing Review",

        "error"

      );



      return;

    }



    try {

      setReviewLoading(true);



      // =================================================

      // UPDATE EXISTING REVIEW

      // ADMIN ONLY

      // =================================================



      if (editingReview) {

        if (!isAdmin) {

          showNotification(

            "You do not have permission to edit reviews.",

            "Access Denied",

            "error"

          );



          return;

        }



        const reviewRef = doc(

          db,

          "reviews",

          editingReview.id

        );



        await updateDoc(

          reviewRef,

          {

            name:

              reviewName.trim(),



            rating:

              Number(reviewRating),



            text:

              reviewText.trim(),



            updatedAt:

              serverTimestamp(),

          }

        );



        setEditingReview(null);



        setReviewName("");

        setReviewText("");

        setReviewRating(0);



        setShowReviewForm(false);



        showNotification(

          "The review has been updated successfully.",

          "Review Updated",

          "success"

        );



        return;

      }



      // =================================================

      // CHECK DUPLICATE REVIEW

      // =================================================



      const duplicateQuery =

        query(

          collection(db, "reviews"),

          where(

            "productId",

            "==",

            product.id

          ),

          where(

            "userId",

            "==",

            user.uid

          )

        );



      const duplicateSnapshot =

        await getDocs(

          duplicateQuery

        );



      if (!duplicateSnapshot.empty) {

        setReviewAlreadySubmitted(

          true

        );



        setCanReview(false);



        showNotification(

          "You have already reviewed this product.",

          "Review Already Submitted",

          "error"

        );



        return;

      }



      // =================================================

      // ADD NEW REVIEW

      // =================================================



      await addDoc(

        collection(db, "reviews"),

        {

          productId:

            product.id,



          productName:

            product.name,



          userId:

            user.uid,



          userEmail:

            user.email || "",



          name:

            reviewName.trim(),



          rating:

            Number(reviewRating),



          text:

            reviewText.trim(),



          createdAt:

            serverTimestamp(),

        }

      );



      // =================================================

      // RESET FORM

      // =================================================



      setReviewName("");

      setReviewText("");

      setReviewRating(0);



      setShowReviewForm(false);



      setCanReview(false);



      setReviewAlreadySubmitted(

        true

      );



      showNotification(

        isAdmin

          ? "Your admin review has been added successfully."

          : "Thank you for sharing your experience with LUMORA.",

        "Review Submitted",

        "success"

      );

    } catch (error) {

      console.error(

        "Error submitting review:",

        error

      );



      showNotification(

        "Unable to save your review. Please try again.",

        "Review Failed",

        "error"

      );

    } finally {

      setReviewLoading(false);

    }

  };



  // =====================================================

  // OPEN DELETE CONFIRMATION

  // =====================================================



  const handleDeleteClick = (

    review

  ) => {

    if (!isAdmin) {

      return;

    }



    setReviewToDelete(

      review

    );

  };



  // =====================================================

  // DELETE REVIEW

  // =====================================================



  const handleDeleteReview =

    async () => {

      if (!isAdmin) {

        showNotification(

          "You do not have permission to delete reviews.",

          "Access Denied",

          "error"

        );



        return;

      }



      if (!reviewToDelete) {

        return;

      }



      try {

        setDeletingReview(true);



        await deleteDoc(

          doc(

            db,

            "reviews",

            reviewToDelete.id

          )

        );



        setReviewToDelete(null);



        showNotification(

          "The customer review has been deleted successfully.",

          "Review Deleted",

          "success"

        );

      } catch (error) {

        console.error(

          "Error deleting review:",

          error

        );



        showNotification(

          "Unable to delete this review. Please try again.",

          "Delete Failed",

          "error"

        );

      } finally {

        setDeletingReview(false);

      }

    };



  // =====================================================

  // FORMAT REVIEW DATE

  // =====================================================



  const formatReviewDate = (

    review

  ) => {

    if (

      review.createdAt &&

      typeof review.createdAt.toDate ===

        "function"

    ) {

      return review.createdAt

        .toDate()

        .toLocaleDateString(

          "en-IN"

        );

    }



    if (review.date) {

      return review.date;

    }



    return "";

  };



  // =====================================================

  // RENDER

  // =====================================================



  return (

    <div>

      {/* =================================================

          NAVBAR

      ================================================= */}



      <Navbar />



      {/* =================================================

          PRODUCT PAGE

      ================================================= */}



      <div className="product-details-page">



        {/* =================================================

            BREADCRUMB

        ================================================= */}



        <div className="product-breadcrumb">



          <Link to="/">

            Home

          </Link>



          <ChevronRight size={14} />



          <Link to="/shop">

            Shop

          </Link>



          <ChevronRight size={14} />



          <span>

            {product.name}

          </span>



        </div>



        {/* =================================================

            PRODUCT SECTION

        ================================================= */}



        <section className="product-details">



          {/* =================================================

              PRODUCT GALLERY

          ================================================= */}



          <div className="product-gallery">



            <div className="product-details-image">



              {productImages.length > 0 ? (

                <img

                  src={

                    productImages[

                      selectedImage

                    ]

                  }

                  alt={product.name}

                />

              ) : (

                <div className="product-image-placeholder">

                  No Image Available

                </div>

              )}



              {/* WISHLIST */}



              <button

                type="button"

                className={`details-wishlist ${

                  liked

                    ? "liked"

                    : ""

                }`}

                onClick={

                  handleWishlist

                }

                aria-label={

                  liked

                    ? "Remove from wishlist"

                    : "Add to wishlist"

                }

              >

                <Heart

                  size={21}

                  fill={

                    liked

                      ? "currentColor"

                      : "none"

                  }

                />

              </button>



            </div>



            {/* IMAGE THUMBNAILS */}



            {productImages.length > 1 && (

              <div className="product-image-thumbnails">



                {productImages.map(

                  (

                    image,

                    index

                  ) => (

                    <button

                      type="button"

                      key={`${image}-${index}`}

                      className={

                        selectedImage ===

                        index

                          ? "active"

                          : ""

                      }

                      onClick={() =>

                        setSelectedImage(

                          index

                        )

                      }

                    >

                      <img

                        src={image}

                        alt={`${product.name} ${

                          index + 1

                        }`}

                      />

                    </button>

                  )

                )}



              </div>

            )}



          </div>



          {/* =================================================

              PRODUCT INFORMATION

          ================================================= */}



          <div className="product-details-info">



            {/* CATEGORY */}



            <p className="details-category">

              {product.category ||

                "ACCESSORIES"}

            </p>



            {/* PRODUCT NAME */}



            <h1>

              {product.name}

            </h1>



            {/* REAL CUSTOMER RATING */}



            <div className="product-rating-summary">



              {reviewCount > 0 ? (

                <>

                  <div className="product-rating-stars">



                    {[1, 2, 3, 4, 5].map(

                      (star) => (

                        <Star

                          key={star}

                          size={17}

                          fill={

                            star <=

                            Math.round(

                              Number(

                                averageRating

                              )

                            )

                              ? "currentColor"

                              : "none"

                          }

                        />

                      )

                    )}



                  </div>



                  <span className="product-rating-value">

                    {averageRating}

                  </span>



                  <span className="product-rating-count">

                    ({reviewCount}{" "}

                    {reviewCount === 1

                      ? "Review"

                      : "Reviews"})

                  </span>

                </>

              ) : (

                <span className="no-product-rating">

                  No reviews yet

                </span>

              )}



            </div>



            {/* PRICE */}



            <div className="details-price">



              <strong>

                ₹

                {price.toLocaleString(

                  "en-IN"

                )}

              </strong>



              {oldPrice > 0 && (

                <del>

                  ₹

                  {oldPrice.toLocaleString(

                    "en-IN"

                  )}

                </del>

              )}



              {discountPercentage > 0 && (

                <span>

                  {discountPercentage}% OFF

                </span>

              )}



            </div>



            <div className="details-divider" />



            {/* DESCRIPTION */}



            <p className="details-description">

              {product.description}

            </p>



            {/* STOCK STATUS */}

            <div
              className={`details-stock-status ${
                isOutOfStock
                  ? "out-of-stock"
                  : "in-stock"
              }`}
            >

              <span className="details-stock-dot" />

              {isOutOfStock ? (
                <span>
                  Out of Stock
                </span>
              ) : (
                <span>
                  In Stock — {stockQuantity}{" "}
                  {stockQuantity === 1
                    ? "item"
                    : "items"} available
                </span>
              )}

            </div>



            {/* QUANTITY */}



            <div className="quantity-section">



              <span>

                Quantity

              </span>



              <div className="quantity-control">

                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={
                    isOutOfStock ||
                    quantity <= 1
                  }
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>

                <span>
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={
                    isOutOfStock ||
                    quantity >= stockQuantity
                  }
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>

              </div>



            </div>



            {/* BUTTONS */}



            <div className="details-buttons">



              <button

                type="button"

                className="details-cart"

                onClick={handleAddToCart}

                disabled={isOutOfStock}

              >

                <ShoppingBag size={18} />

                {isOutOfStock
                  ? "Out of Stock"
                  : "Add to Cart"}

              </button>



              <button

                type="button"

                className="details-buy"

                onClick={handleBuyNow}

                disabled={isOutOfStock}

              >

                {isOutOfStock
                  ? "Out of Stock"
                  : "Buy Now"}

              </button>



            </div>



          </div>



        </section>



        {/* =================================================

            CUSTOMER REVIEWS

        ================================================= */}



        <section className="customer-reviews">



          {/* REVIEWS HEADER */}



          <div className="reviews-header">



            <div>



              <p className="reviews-eyebrow">

                CUSTOMER FEEDBACK

              </p>



              <h2>

                Customer Reviews

              </h2>



              <p>

                See what our customers have to say

                about this product.

              </p>



            </div>



            <button

              type="button"

              className="write-review-button"

              onClick={

                handleOpenReviewForm

              }

            >

              {showReviewForm

                ? "Close"

                : "Write a Review"}

            </button>



          </div>



          {/* =================================================

              REVIEW FORM

          ================================================= */}



          {showReviewForm && (

            <form

              className="review-form"

              onSubmit={

                handleSubmitReview

              }

            >



              <div className="review-form-header">



                <h3>

                  {editingReview

                    ? "Edit Review"

                    : "Write Your Review"}

                </h3>



                {editingReview && (

                  <button

                    type="button"

                    className="review-cancel-edit"

                    onClick={

                      handleCancelEdit

                    }

                  >

                    Cancel Edit

                  </button>

                )}



              </div>



              {/* NAME */}



              <div className="review-field">



                <label htmlFor="review-name">

                  Your Name

                </label>



                <input

                  id="review-name"

                  type="text"

                  placeholder="Enter your name"

                  value={reviewName}

                  onChange={(event) =>

                    setReviewName(

                      event.target.value

                    )

                  }

                />



              </div>



              {/* RATING */}



              <div className="review-field">



                <label>

                  Your Rating

                </label>



                <div className="review-stars">



                  {[1, 2, 3, 4, 5].map(

                    (star) => (

                      <button

                        key={star}

                        type="button"

                        className={

                          star <=

                          reviewRating

                            ? "selected"

                            : ""

                        }

                        onClick={() =>

                          setReviewRating(

                            star

                          )

                        }

                        aria-label={`Rate ${star} stars`}

                      >

                        <Star

                          size={24}

                          fill={

                            star <=

                            reviewRating

                              ? "currentColor"

                              : "none"

                          }

                        />

                      </button>

                    )

                  )}



                </div>



              </div>



              {/* REVIEW TEXT */}



              <div className="review-field">



                <label htmlFor="review-text">

                  Your Review

                </label>



                <textarea

                  id="review-text"

                  rows="5"

                  placeholder="Tell us about your experience..."

                  value={reviewText}

                  onChange={(event) =>

                    setReviewText(

                      event.target.value

                    )

                  }

                />



              </div>



              {/* SUBMIT */}



              <button

                type="submit"

                className="submit-review-button"

                disabled={

                  reviewLoading

                }

              >

                {reviewLoading

                  ? editingReview

                    ? "Updating..."

                    : "Submitting..."

                  : editingReview

                    ? "Update Review"

                    : "Submit Review"}

              </button>



            </form>

          )}



          {/* =================================================

              REVIEW LIST

          ================================================= */}



          <div className="reviews-list">



            {reviews.length === 0 ? (



              <div className="no-reviews">



                <Star size={28} />



                <h3>

                  No reviews yet

                </h3>



                <p>

                  Be the first customer to

                  review this product.

                </p>



              </div>



            ) : (



              reviews.map(

                (review) => (



                  <article

                    className="review-card"

                    key={review.id}

                  >



                    <div className="review-content">



                      {/* LEFT */}



                      <div className="review-main">



                        <h3>

                            {review.name ||

                            review.userName ||

                            "Customer"}

                        </h3>



                        <p className="review-text">

                            {review.text ||

                            review.comment ||

                            review.review ||

                            "No review text available."}

                        </p>



                      </div>



                      {/* RIGHT */}



                      <div className="review-meta">



                        <div className="review-card-stars">



                          {[1, 2, 3, 4, 5].map(

                            (star) => (

                              <Star

                                key={star}

                                size={18}

                                fill={

                                  star <=

                                  Number(

                                    review.rating

                                  )

                                    ? "currentColor"

                                    : "none"

                                }

                              />

                            )

                          )}



                        </div>



                        <span className="review-rating-number">

                          {review.rating} / 5

                        </span>



                        <span className="review-date">

                          {formatReviewDate(

                            review

                          )}

                        </span>



                        {/* ADMIN ACTIONS */}



                        {isAdmin && (

                          <div className="admin-review-actions">



                            <button

                              type="button"

                              className="admin-edit-review-button"

                              onClick={() =>

                                handleEditReview(

                                  review

                                )

                              }

                              title="Edit review"

                            >

                              <Pencil

                                size={15}

                              />



                              Edit

                            </button>



                            <button

                              type="button"

                              className="admin-delete-review-button"

                              onClick={() =>

                                handleDeleteClick(

                                  review

                                )

                              }

                              title="Delete review"

                            >

                              <Trash2

                                size={15}

                              />



                              Delete

                            </button>



                          </div>

                        )}



                      </div>



                    </div>



                  </article>



                )

              )



            )}



          </div>



        </section>



      </div>



      {/* =====================================================

          LUMORA NOTIFICATION

      ===================================================== */}



      {notification && (

        <div

          className="lumora-notification-overlay"

          onClick={

            closeNotification

          }

        >



          <div

            className={`lumora-notification ${

              notification.type ===

              "error"

                ? "lumora-notification-error"

                : "lumora-notification-success"

            }`}

            onClick={(event) =>

              event.stopPropagation()

            }

          >



            <button

              type="button"

              className="lumora-notification-close"

              onClick={

                closeNotification

              }

              aria-label="Close notification"

            >

              <X size={18} />

            </button>



            <div className="lumora-notification-icon">

              {notification.type ===

              "error"

                ? "!"

                : "✓"}

            </div>



            <div className="lumora-notification-content">



              <h3>

                {notification.title}

              </h3>



              <p>

                {notification.message}

              </p>



            </div>



          </div>



        </div>

      )}



      {/* =====================================================

          DELETE REVIEW CONFIRMATION

      ===================================================== */}



      {reviewToDelete && (

        <div

          className="lumora-notification-overlay"

          onClick={() =>

            !deletingReview &&

            setReviewToDelete(

              null

            )

          }

        >



          <div

            className="lumora-delete-modal"

            onClick={(event) =>

              event.stopPropagation()

            }

          >



            <button

              type="button"

              className="lumora-notification-close"

              onClick={() =>

                !deletingReview &&

                setReviewToDelete(

                  null

                )

              }

              aria-label="Close"

              disabled={

                deletingReview

              }

            >

              <X size={18} />

            </button>



            <div className="lumora-delete-icon">

              <Trash2 size={24} />

            </div>



            <h3>

              Delete Review?

            </h3>



            <p>

              Are you sure you want to delete

              this customer review?

            </p>



            <div className="lumora-delete-review-preview">



              <strong>

                {reviewToDelete.name ||

                  reviewToDelete.userName ||

                  "Customer"}

              </strong>



              <span>

                {reviewToDelete.text ||

                reviewToDelete.comment ||

                reviewToDelete.review ||

                "No review text available."}

              </span>



            </div>



            <div className="lumora-delete-actions">



              <button

                type="button"

                className="lumora-cancel-button"

                onClick={() =>

                  setReviewToDelete(

                    null

                  )

                }

                disabled={

                  deletingReview

                }

              >

                Cancel

              </button>



              <button

                type="button"

                className="lumora-confirm-delete-button"

                onClick={

                  handleDeleteReview

                }

                disabled={

                  deletingReview

                }

              >

                {deletingReview

                  ? "Deleting..."

                  : "Delete Review"}

              </button>



            </div>



          </div>



        </div>

      )}



    </div>

  );

}



export default ProductDetails;