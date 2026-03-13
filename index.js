/**
 * DropDash Backend
 * Login + Promo Notification + Auto Expiry
 */

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

// ---------------- RATE LIMIT ----------------
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30
});

// ---------------- FIREBASE ----------------
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://drop-dash-f40a0-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = admin.database();

// ---------------- HEALTH ----------------
app.get("/", (_, res) => res.send("DropDash backend running ✅"));

// ---------------- LOGIN SUCCESS ----------------
app.post("/login-success", loginLimiter, async (req, res) => {
  const { fcmToken, idToken } = req.body;

  if (!fcmToken || !idToken)
    return res.status(400).json({ error: "Missing data" });

  try {

    // Verify user
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // Save device token (multiple devices support)
    await db
      .ref(`users/${uid}/tokens/${fcmToken}`)
      .set(true);

    // Get all tokens of this user
    const snap = await db.ref(`users/${uid}/tokens`).once("value");

    const tokens = [];

    snap.forEach(child => {
      tokens.push(child.key);
    });

    // Send notification to ALL devices
    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        data: {
          title: "Login Successful",
          body: "Welcome to DropDash 🎉",
          type: "login"
        },
        android: { priority: "high" }
      });
    }

    res.json({ success: true, devicesNotified: tokens.length });

  } catch (e) {
    console.error(e);
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ---------------- PROMO RELEASE ----------------
app.post("/promo-release", async (req, res) => {
  const { promoCode, discountPercent } = req.body;
  if (!promoCode || discountPercent == null)
    return res.status(400).json({ error: "Missing data" });

  try {
    const snap = await db.ref("users").once("value");
    const tokens = [];

    snap.forEach(user => {

      const tokenObj = user.child("tokens").val();

      if (tokenObj) {
        tokens.push(...Object.keys(tokenObj));
      }

    });

    if (!tokens.length)
      return res.json({ success: true, message: "No users" });

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      data: {
        title: "New Promocode 🎉",
        body: `Use ${promoCode} & get ${discountPercent}% OFF`,
        type: "promo",
        promoCode,
        discountPercent: discountPercent.toString()
      },
      android: { priority: "high" }
    });

    res.json({ success: true, sent: response.successCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- AUTO PROMO EXPIRY ----------------
// Runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  const now = Date.now();
  const snap = await db.ref("promoCodes").once("value");
  if (!snap.exists()) return;

  snap.forEach(child => {
    const promo = child.val();
    if (!promo.expired && promo.expiryAt <= now) {
      db.ref(`promoCodes/${child.key}/expired`).set(true);
      console.log("⏳ Promo expired:", promo.promoCode);
    }
  });
});

// ---------------- START ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on ${PORT}`)
);
