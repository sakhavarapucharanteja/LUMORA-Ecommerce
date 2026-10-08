const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

const uid = "tTNuhaMtsjPsqRDZZOurjtwHS0H2";

auth
  .setCustomUserClaims(uid, {
    admin: true,
  })
  .then(() => {
    console.log("✅ Admin role assigned successfully.");
    console.log("UID:", uid);
    console.log("admin: true");

    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error assigning admin role:");
    console.error(error);

    process.exit(1);
  });