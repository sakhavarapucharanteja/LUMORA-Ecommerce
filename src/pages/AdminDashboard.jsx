import { useEffect, useState } from "react";



import {

  collection,

  deleteDoc,

  doc,

  getDocs,

  setDoc,

} from "firebase/firestore";



import {

  getDownloadURL,

  ref,

  uploadBytes,

} from "firebase/storage";



import { db, storage } from "../firebase/firebase";



import "./AdminDashboard.css";





const emptyProduct = {

  name: "",

  category: "Bangles",

  price: "",

  oldPrice: "",

  stock: 0,

  image: "",

  images: [""],

  description: "",

};





function AdminDashboard() {

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);



  const [form, setForm] = useState(emptyProduct);



  const [editingId, setEditingId] = useState(null);



  const [showForm, setShowForm] = useState(false);



  const [loading, setLoading] = useState(true);



  const [saving, setSaving] = useState(false);



  const [uploadingImage, setUploadingImage] = useState(false);



  const [message, setMessage] = useState("");



  const [deleteProduct, setDeleteProduct] = useState(null);

  const [deleting, setDeleting] = useState(false);





  // =========================

  // LOAD PRODUCTS

  // =========================



  const loadProducts = async () => {
  try {
    setLoading(true);

    // =========================
    // LOAD PRODUCTS
    // =========================

    const snapshot = await getDocs(
      collection(db, "products")
    );

    const productList = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setProducts(productList);

    // =========================
    // LOAD ORDERS
    // =========================

    const ordersSnapshot = await getDocs(
      collection(db, "orders")
    );

    const orderList = ordersSnapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setOrders(orderList);

  } catch (error) {
    console.error("Error loading dashboard data:", error);

    setMessage("Failed to load dashboard data.");

  } finally {
    setLoading(false);
  }
 };





  useEffect(() => {

    loadProducts();

  }, []);





  // =========================
    // ANALYTICS CALCULATIONS
    // =========================

    const totalOrders = orders.length;

    const totalRevenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce(
        (total, order) => total + Number(order.total || 0),
        0
    );

    const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
    ).length;

    const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
    ).length;

    const lowStockProducts = products.filter(
    (product) => Number(product.stock || 0) <= 5
    );

    const lowStockCount = lowStockProducts.length;

    // =========================
    // TOP SELLING PRODUCTS
    // =========================

    const productSales = {};

    orders
    .filter((order) => order.status !== "Cancelled")
    .forEach((order) => {
        (order.items || []).forEach((item) => {
        const productId = item.productId || item.id;

        if (!productId) return;

        if (!productSales[productId]) {
            productSales[productId] = {
            id: productId,
            name: item.name || "Unknown Product",
            quantity: 0,
            revenue: 0,
            };
        }

        productSales[productId].quantity += Number(
            item.quantity || 0
        );

        productSales[productId].revenue +=
            Number(item.price || 0) *
            Number(item.quantity || 0);
        });
    });

    const topSellingProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

    // =========================
    // SALES OVERVIEW
    // =========================

    const salesByDate = {};

    orders
    .filter((order) => order.status !== "Cancelled")
    .forEach((order) => {
        const date =
        order.date ||
        order.createdAt?.toDate?.().toLocaleDateString() ||
        "Unknown";

        if (!salesByDate[date]) {
        salesByDate[date] = {
            date,
            orders: 0,
            revenue: 0,
        };
        }

        salesByDate[date].orders += 1;
        salesByDate[date].revenue += Number(
        order.total || 0
        );
    });

    const salesOverview = Object.values(salesByDate);





  // =========================

  // FORM HANDLING

  // =========================



  const handleChange = (event) => {

    const { name, value } = event.target;



    setForm((previous) => ({

      ...previous,

      [name]: value,

    }));

  };





  const handleImageChange = (index, value) => {

    setForm((previous) => {

      const updatedImages = [...previous.images];



      updatedImages[index] = value;



      return {

        ...previous,

        images: updatedImages,

      };

    });

  };





  const addImageField = () => {

    setForm((previous) => ({

      ...previous,

      images: [...previous.images, ""],

    }));

  };





  const removeImageField = (index) => {

    setForm((previous) => {

      const updatedImages = previous.images.filter(

        (_, imageIndex) => imageIndex !== index

      );



      return {

        ...previous,

        images:

          updatedImages.length > 0

            ? updatedImages

            : [""],

      };

    });

  };





  // =========================

  // FIREBASE STORAGE UPLOAD

  // =========================



  const uploadImage = async (

    file,

    folder = "products"

  ) => {

    if (!file) {

      return "";

    }



    try {

      setUploadingImage(true);



      setMessage("");



      const fileExtension =

        file.name.split(".").pop()?.toLowerCase() || "jpg";



      const uniqueName =

        `${Date.now()}-${Math.random()

          .toString(36)

          .substring(2, 10)}.${fileExtension}`;



      const storageRef = ref(

        storage,

        `${folder}/${uniqueName}`

      );



      await uploadBytes(

        storageRef,

        file,

        {

          contentType: file.type,

        }

      );



      const downloadURL =

        await getDownloadURL(storageRef);



      return downloadURL;

    } catch (error) {

      console.error(

        "Error uploading image:",

        error

      );



      setMessage(

        "Failed to upload image. Please try again."

      );



      return "";

    } finally {

      setUploadingImage(false);

    }

  };





  // =========================

  // MAIN IMAGE UPLOAD

  // =========================



  const handleMainImageUpload = async (event) => {

    const file = event.target.files?.[0];



    if (!file) {

      return;

    }



    if (!file.type.startsWith("image/")) {

      setMessage(

        "Please select a valid image file."

      );



      event.target.value = "";



      return;

    }



    if (file.size > 5 * 1024 * 1024) {

      setMessage(

        "Image size must be less than 5MB."

      );



      event.target.value = "";



      return;

    }



    const imageURL = await uploadImage(

      file,

      "products/main"

    );



    if (imageURL) {

      setForm((previous) => ({

        ...previous,

        image: imageURL,

      }));



      setMessage(

        "Main image uploaded successfully."

      );

    }



    event.target.value = "";

  };





  // =========================

  // GALLERY IMAGE UPLOAD

  // =========================



  const handleGalleryImageUpload = async (

    index,

    event

  ) => {

    const file = event.target.files?.[0];



    if (!file) {

      return;

    }



    if (!file.type.startsWith("image/")) {

      setMessage(

        "Please select a valid image file."

      );



      event.target.value = "";



      return;

    }



    if (file.size > 5 * 1024 * 1024) {

      setMessage(

        "Image size must be less than 5MB."

      );



      event.target.value = "";



      return;

    }



    const imageURL = await uploadImage(

      file,

      "products/gallery"

    );



    if (imageURL) {

      handleImageChange(

        index,

        imageURL

      );



      setMessage(

        "Gallery image uploaded successfully."

      );

    }



    event.target.value = "";

  };





  // =========================

  // OPEN ADD FORM

  // =========================



  const openAddForm = () => {

    setEditingId(null);



    setForm({

      ...emptyProduct,

      images: [""],

    });



    setMessage("");



    setShowForm(true);

  };





  // =========================

  // OPEN EDIT FORM

  // =========================



  const openEditForm = (product) => {

    setEditingId(product.id);



    const existingImages =

      Array.isArray(product.images) &&

      product.images.length > 0

        ? product.images

        : [product.image || ""];



    setForm({

      name: product.name || "",



      category:

        product.category || "Bangles",



      price:

        product.price ?? "",



      oldPrice:product.oldPrice ?? "",
      
      stock: product.stock ?? 0,



      image:

        product.image || "",



      images:

        existingImages,



      description:

        product.description || "",

    });



    setMessage("");



    setShowForm(true);

  };





  // =========================

  // CLOSE FORM

  // =========================



  const closeForm = () => {

    if (saving || uploadingImage) {

      return;

    }



    setShowForm(false);



    setEditingId(null);



    setForm({

      ...emptyProduct,

      images: [""],

    });



    setMessage("");

  };





  // =========================

  // SAVE PRODUCT

  // =========================



    const handleSave = async (event) => {
    event.preventDefault();

    if (uploadingImage) {
        setMessage(
        "Please wait until the image upload is finished."
        );

        return;
    }

    if (!form.name.trim()) {
        setMessage(
        "Please enter a product name."
        );

        return;
    }

    if (!form.price) {
        setMessage(
        "Please enter a product price."
        );

        return;
    }

    if (Number(form.price) < 0) {
        setMessage(
        "Product price cannot be negative."
        );

        return;
    }

    if (
        form.oldPrice &&
        Number(form.oldPrice) < 0
    ) {
        setMessage(
        "Old price cannot be negative."
        );

        return;
    }

    // =========================
    // STOCK VALIDATION
    // =========================

    if (
        form.stock === "" ||
        form.stock === null ||
        form.stock === OutOfStock
    ) {
        setMessage(
        "Please enter the stock quantity."
        );

        return;
    }

    if (
        Number.isNaN(Number(form.stock)) ||
        Number(form.stock) < 0
    ) {
        setMessage(
        "Stock quantity cannot be negative."
        );

        return;
    }

    if (!form.image.trim()) {
        setMessage(
        "Please upload the main product image."
        );

        return;
    }

    try {
        setSaving(true);

        setMessage("");

        const productId =
        editingId ||
        `product_${Date.now()}`;

        const cleanedImages = form.images
        .map((image) => image.trim())
        .filter(Boolean);

        const productData = {
        name: form.name.trim(),

        category: form.category,

        price: Number(form.price),

        oldPrice: form.oldPrice
            ? Number(form.oldPrice)
            : null,

        // =========================
        // STOCK
        // =========================

        stock: Number(form.stock),

        image: form.image.trim(),

        images:
            cleanedImages.length > 0
            ? cleanedImages
            : [form.image.trim()],

        description:
            form.description.trim(),
        };

        await setDoc(
        doc(
            db,
            "products",
            productId
        ),
        productData
        );

        setMessage(
        editingId
            ? "Product updated successfully."
            : "Product added successfully."
        );

        setShowForm(false);

        setEditingId(null);

        setForm({
        ...emptyProduct,
        images: [""],
        });

        await loadProducts();

    } catch (error) {
        console.error(
        "Error saving product:",
        error
        );

        setMessage(
        "Failed to save product. Please try again."
        );

    } finally {
        setSaving(false);
    }
    };


     // =========================

    // DELETE PRODUCT

    // =========================



    const handleDelete = (productId) => {

    const product = products.find(

        (item) => item.id === productId

    );



    if (!product) {

        return;

    }



    setDeleteProduct(product);

    };





    // =========================

    // CONFIRM DELETE PRODUCT

    // =========================



    const confirmDeleteProduct = async () => {

    if (!deleteProduct) {

        return;

    }



    try {

        setDeleting(true);



        await deleteDoc(

        doc(

            db,

            "products",

            deleteProduct.id

        )

        );



        const deletedProductName =

        deleteProduct.name;



        setDeleteProduct(null);



        setMessage(

        `"${deletedProductName}" deleted successfully.`

        );



        await loadProducts();

    } catch (error) {

        console.error(

        "Error deleting product:",

        error

        );



        setMessage(

        "Failed to delete product. Please try again."

        );

    } finally {

        setDeleting(false);

    }

    };





  return (

    <div className="admin-dashboard">


        {/* =========================
            ANALYTICS DASHBOARD
        ========================= */}

        <section className="admin-analytics-section">

        <div className="admin-section-heading">
            <div>
            <span>OVERVIEW</span>
            <h2>Analytics</h2>
            <p>Track your LUMORA store performance.</p>
            </div>
        </div>

        {/* ANALYTICS CARDS */}

        <div className="admin-analytics-grid">

            {/* TOTAL ORDERS */}
            <div className="admin-analytics-card">
            <div className="admin-analytics-card-top">
                <span>Total Orders</span>
                <div className="admin-analytics-icon">🛍️</div>
            </div>

            <h3>{totalOrders}</h3>

            <p>
                All orders received
            </p>
            </div>


            {/* TOTAL REVENUE */}
            <div className="admin-analytics-card">
            <div className="admin-analytics-card-top">
                <span>Total Revenue</span>
                <div className="admin-analytics-icon">₹</div>
            </div>

            <h3>
                ₹{totalRevenue.toLocaleString("en-IN")}
            </h3>

            <p>
                Excluding cancelled orders
            </p>
            </div>


            {/* TOTAL PRODUCTS */}
            <div className="admin-analytics-card">
            <div className="admin-analytics-card-top">
                <span>Total Products</span>
                <div className="admin-analytics-icon">✦</div>
            </div>

            <h3>{products.length}</h3>

            <p>
                Products in catalog
            </p>
            </div>


            {/* DELIVERED */}
            <div className="admin-analytics-card">
            <div className="admin-analytics-card-top">
                <span>Delivered</span>
                <div className="admin-analytics-icon">✓</div>
            </div>

            <h3>{deliveredOrders}</h3>

            <p>
                Successfully delivered
            </p>
            </div>


            {/* CANCELLED */}
            <div className="admin-analytics-card">
            <div className="admin-analytics-card-top">
                <span>Cancelled</span>
                <div className="admin-analytics-icon">×</div>
            </div>

            <h3>{cancelledOrders}</h3>

            <p>
                Cancelled orders
            </p>
            </div>


            {/* LOW STOCK */}
            <div className="admin-analytics-card">
            <div className="admin-analytics-card-top">
                <span>Low Stock</span>
                <div className="admin-analytics-icon">!</div>
            </div>

            <h3>{lowStockCount}</h3>

            <p>
                Products with ≤ 5 units
            </p>
            </div>

        </div>


        {/* =========================
            SALES OVERVIEW
        ========================= */}

        <div className="admin-analytics-content">

            <div className="admin-analytics-panel">

            <div className="admin-analytics-panel-header">
                <div>
                <span>PERFORMANCE</span>
                <h3>Sales Overview</h3>
                </div>
            </div>

            {salesOverview.length === 0 ? (
                <div className="admin-analytics-empty">
                <p>No sales data available yet.</p>
                </div>
            ) : (
                <div className="admin-sales-list">

                {salesOverview.map((sale, index) => (
                    <div
                    className="admin-sales-row"
                    key={`${sale.date}-${index}`}
                    >

                    <div>
                        <strong>{sale.date}</strong>
                        <span>
                        {sale.orders}{" "}
                        {sale.orders === 1 ? "order" : "orders"}
                        </span>
                    </div>

                    <strong>
                        ₹{sale.revenue.toLocaleString("en-IN")}
                    </strong>

                    </div>
                ))}

                </div>
            )}

            </div>


            {/* =========================
                TOP SELLING PRODUCTS
            ========================= */}

            <div className="admin-analytics-panel">

            <div className="admin-analytics-panel-header">
                <div>
                <span>BEST SELLERS</span>
                <h3>Top Selling Products</h3>
                </div>
            </div>

            {topSellingProducts.length === 0 ? (
                <div className="admin-analytics-empty">
                <p>No sales data available yet.</p>
                </div>
            ) : (
                <div className="admin-top-products">

                {topSellingProducts.map((product, index) => (
                    <div
                    className="admin-top-product-row"
                    key={product.id}
                    >

                    <div className="admin-top-product-rank">
                        #{index + 1}
                    </div>

                    <div className="admin-top-product-info">
                        <strong>{product.name}</strong>

                        <span>
                        {product.quantity}{" "}
                        {product.quantity === 1
                            ? "unit"
                            : "units"}{" "}
                        sold
                        </span>
                    </div>

                    <strong>
                        ₹{product.revenue.toLocaleString("en-IN")}
                    </strong>

                    </div>
                ))}

                </div>
            )}

            </div>

        </div>


        {/* =========================
            LOW STOCK PRODUCTS
        ========================= */}

        <div className="admin-analytics-panel admin-low-stock-panel">

            <div className="admin-analytics-panel-header">
            <div>
                <span>INVENTORY ALERT</span>
                <h3>Low Stock Products</h3>
            </div>
            </div>

            {lowStockProducts.length === 0 ? (
            <div className="admin-analytics-empty">
                <p>✓ All products have healthy stock levels.</p>
            </div>
            ) : (
            <div className="admin-low-stock-list">

                {lowStockProducts.map((product) => (
                <div
                    className="admin-low-stock-row"
                    key={product.id}
                >

                    <div className="admin-low-stock-product">

                    <img
                        src={product.image}
                        alt={product.name}
                    />

                    <div>
                        <strong>{product.name}</strong>
                        <span>{product.category}</span>
                    </div>

                    </div>

                    <div
                    className={`admin-low-stock-count ${
                        Number(product.stock ?? 0) === 0
                        ? "out"
                        : ""
                    }`}
                    >
                    {Number(product.stock ?? 0) === 0
                        ? "Out of stock"
                        : `${Number(product.stock ?? 0)} left`}
                    </div>

                </div>
                ))}

            </div>
            )}

        </div>

        </section>



      {/* =========================

          HEADER

      ========================= */}



      <div className="admin-dashboard-header">



        <div>



          <p className="admin-eyebrow">

            LUMORA ADMIN

          </p>



          <h1>

            Product Management

          </h1>



          <p>

            Add, edit and manage your products.

          </p>



        </div>





        <button

          type="button"

          className="admin-add-product-button"

          onClick={openAddForm}

        >

          + Add Product

        </button>



      </div>





      {/* =========================

          MESSAGE

      ========================= */}



      {message && (

        <div className="admin-message">

          {message}

        </div>

      )}





      {/* =========================

          PRODUCT FORM

      ========================= */}



      {showForm && (

        <div className="admin-product-form-wrapper">



          <div className="admin-product-form-header">



            <div>



              <span>

                {editingId

                  ? "EDIT PRODUCT"

                  : "NEW PRODUCT"}

              </span>



              <h2>

                {editingId

                  ? "Edit Product"

                  : "Add Product"}

              </h2>



            </div>





            <button

              type="button"

              className="admin-close-button"

              onClick={closeForm}

              disabled={

                saving ||

                uploadingImage

              }

            >

              ×

            </button>



          </div>





          <form

            className="admin-product-form"

            onSubmit={handleSave}

          >



            {/* =========================

                BASIC DETAILS

            ========================= */}



            <div className="admin-form-grid">



              {/* PRODUCT NAME */}



              <div className="admin-form-group">



                <label>

                  Product Name

                </label>



                <input

                  type="text"

                  name="name"

                  value={form.name}

                  onChange={handleChange}

                  placeholder="Elegant Gold Bangles"

                  disabled={

                    saving ||

                    uploadingImage

                  }

                />



              </div>





              {/* CATEGORY */}



              <div className="admin-form-group">



                <label>

                  Category

                </label>



                <select

                  name="category"

                  value={form.category}

                  onChange={handleChange}

                  disabled={

                    saving ||

                    uploadingImage

                  }

                >



                  <option value="Bangles">

                    Bangles

                  </option>



                  <option value="Earrings">

                    Earrings

                  </option>



                  <option value="Hair Clips">

                    Hair Clips

                  </option>



                  <option value="Rings">

                    Rings

                  </option>



                  <option value="Necklaces">

                    Necklaces

                  </option>



                  <option value="Bracelets">

                    Bracelets

                  </option>



                </select>



              </div>





              {/* PRICE */}



              <div className="admin-form-group">



                <label>

                  Price

                </label>



                <input

                  type="number"

                  name="price"

                  value={form.price}

                  onChange={handleChange}

                  placeholder="499"

                  min="0"

                  step="1"

                  disabled={

                    saving ||

                    uploadingImage

                  }

                />



              </div>





              {/* OLD PRICE */}



              <div className="admin-form-group">



                <label>

                  Old Price

                </label>



                <input

                  type="number"

                  name="oldPrice"

                  value={form.oldPrice}

                  onChange={handleChange}

                  placeholder="799"

                  min="0"

                  step="1"

                  disabled={

                    saving ||

                    uploadingImage

                  }

                />



              </div>

              <div className="admin-form-group">

                <label>
                    Stock Quantity
                </label>

                <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    step="1"
                    disabled={
                        saving ||
                        uploadingImage
                    }
                />

            </div>



            </div>





            {/* =========================

                DESCRIPTION

            ========================= */}



            <div className="admin-form-group">



              <label>

                Product Description

              </label>



              <textarea

                name="description"

                value={form.description}

                onChange={handleChange}

                rows="5"

                placeholder="Describe the product..."

                disabled={

                  saving ||

                  uploadingImage

                }

              />



            </div>





            {/* =========================

                MAIN IMAGE

            ========================= */}



            <div className="admin-form-group">



              <label>

                Main Product Image

              </label>



              <input

                type="file"

                accept="image/*"

                onChange={

                  handleMainImageUpload

                }

                disabled={

                  saving ||

                  uploadingImage

                }

              />





              {uploadingImage && (

                <p

                  style={{

                    marginTop: "10px",

                    color: "#a45d66",

                    fontSize: "13px",

                  }}

                >

                  Uploading image...

                </p>

              )}





              {form.image && (

                <div className="admin-image-preview">



                  <img

                    src={form.image}

                    alt={

                      form.name ||

                      "Product preview"

                    }

                  />



                </div>

              )}



            </div>





            {/* =========================

                GALLERY IMAGES

            ========================= */}



            <div className="admin-gallery-section">



              <div className="admin-gallery-header">



                <div>



                  <label>

                    Gallery Images

                  </label>



                  <p>

                    Add additional product images.

                  </p>



                </div>





                <button

                  type="button"

                  onClick={addImageField}

                  className="admin-add-image-button"

                  disabled={

                    saving ||

                    uploadingImage

                  }

                >

                  + Add Image

                </button>



              </div>





              {form.images.map(

                (image, index) => (

                  <div

                    className="admin-gallery-input"

                    key={`${index}-${image}`}

                  >



                    <input

                      type="file"

                      accept="image/*"

                      onChange={(event) =>

                        handleGalleryImageUpload(

                          index,

                          event

                        )

                      }

                      disabled={

                        saving ||

                        uploadingImage

                      }

                    />





                    {form.images.length > 1 && (

                      <button

                        type="button"

                        onClick={() =>

                          removeImageField(index)

                        }

                        className="admin-remove-image"

                        disabled={

                          saving ||

                          uploadingImage

                        }

                        aria-label="Remove image"

                      >

                        ×

                      </button>

                    )}



                  </div>

                )

              )}





              {/* EXISTING GALLERY PREVIEWS */}



              {form.images.some(

                (image) => image

              ) && (

                <div

                  style={{

                    display: "flex",

                    flexWrap: "wrap",

                    gap: "12px",

                    marginTop: "15px",

                  }}

                >



                  {form.images.map(

                    (image, index) =>

                      image ? (

                        <div

                          key={`preview-${index}-${image}`}

                          style={{

                            width: "100px",

                            height: "100px",

                            border:

                              "1px solid #eadfda",

                            borderRadius: "8px",

                            overflow: "hidden",

                            background:

                              "#f6f1ee",

                          }}

                        >



                          <img

                            src={image}

                            alt={`Gallery ${index + 1}`}

                            style={{

                              width: "100%",

                              height: "100%",

                              objectFit: "cover",

                            }}

                          />



                        </div>

                      ) : null

                  )}



                </div>

              )}



            </div>





            {/* =========================

                FORM ACTIONS

            ========================= */}



            <div className="admin-form-actions">



              <button

                type="button"

                className="admin-cancel-button"

                onClick={closeForm}

                disabled={

                  saving ||

                  uploadingImage

                }

              >

                Cancel

              </button>





              <button

                type="submit"

                className="admin-save-button"

                disabled={

                  saving ||

                  uploadingImage

                }

              >



                {uploadingImage

                  ? "Uploading..."

                  : saving

                    ? "Saving..."

                    : editingId

                      ? "Save Changes"

                      : "Add Product"}



              </button>



            </div>



          </form>



        </div>

      )}





      {/* =========================

          PRODUCTS

      ========================= */}



      <section className="admin-products-section">



        <div className="admin-section-heading">



          <div>



            <span>

              CATALOG

            </span>



            <h2>

              Products

            </h2>



          </div>





          <strong>

            {products.length} products

          </strong>



        </div>





        {loading ? (



          <div className="admin-loading">

            Loading products...

          </div>



        ) : products.length === 0 ? (



          <div className="admin-empty">



            <h3>

              No products yet

            </h3>



            <p>

              Add your first LUMORA product.

            </p>



            <button

              type="button"

              onClick={openAddForm}

              className="admin-add-product-button"

            >

              + Add Product

            </button>



          </div>



        ) : (



          <div className="admin-products-grid">



            {products.map(

              (product) => (



                <div

                  className="admin-product-card"

                  key={product.id}

                >



                  <div className="admin-product-image">



                    <img

                      src={product.image}

                      alt={

                        product.name ||

                        "Product"

                      }

                    />



                  </div>





                  <div className="admin-product-content">



                    <span className="admin-product-category">

                      {product.category}

                    </span>





                    <h3>

                      {product.name}

                    </h3>





                    <div className="admin-product-price">
                        <strong>
                            ₹{product.price}
                        </strong>
                        {product.oldPrice && (
                            <del>
                                ₹{product.oldPrice}
                            </del>
                        )}
                    </div>

                    <div className="admin-product-stock">

                        {Number(product.stock ?? 0) > 0 ? (
                            <>
                            <span className="admin-stock-dot in-stock-dot" />
                            {product.stock} in stock
                            </>
                        ) : (
                            <>
                            <span className="admin-stock-dot out-stock-dot" />
                            Out of stock
                            </>
                        )}

                    </div>





                    <div className="admin-product-actions">



                      <button

                        type="button"

                        onClick={() =>

                          openEditForm(product)

                        }

                        className="admin-edit-button"

                      >

                        Edit

                      </button>





                      <button

                        type="button"

                        onClick={() =>

                          handleDelete(

                            product.id

                          )

                        }

                        className="admin-delete-button"

                      >

                        Delete

                      </button>



                    </div>



                  </div>



                </div>



              )

            )}



          </div>



        )}
      </section>

      {/* =========================
          DELETE CONFIRMATION MODAL
      ========================= */}

      {deleteProduct && (
        <div className="lumora-notification-overlay">
          <div className="lumora-delete-modal">
            <div className="lumora-delete-icon">
              🗑️
            </div>

            <p className="lumora-delete-eyebrow">
              DELETE PRODUCT
            </p>

            <h2>Delete Product?</h2>

            <p className="lumora-delete-message">
              Are you sure you want to delete{" "}
              <strong>"{deleteProduct.name}"</strong>?
            </p>

            <p className="lumora-delete-warning">
              This action cannot be undone.
            </p>

            <div className="lumora-delete-actions">
              <button
                type="button"
                className="lumora-delete-cancel"
                onClick={() => setDeleteProduct(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="lumora-delete-confirm"
                onClick={confirmDeleteProduct}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;