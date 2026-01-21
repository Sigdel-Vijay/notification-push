/**
 * DropDash Backend - Login Success Notification
 * DATA payload (Custom Sound Supported)
 * Fully Free + Production Safe
 */

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

/* ✅ REQUIRED FOR RENDER / FLY.IO */
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// -------------------- RATE LIMIT --------------------
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

// -------------------- FIREBASE ADMIN --------------------
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://drop-dash-f40a0-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.send("DropDash backend running ✅");
});

// -------------------- LOGIN SUCCESS NOTIFICATION --------------------
app.post("/login-success", loginLimiter, async (req, res) => {
  const { fcmToken, idToken } = req.body;

  if (!fcmToken || !idToken) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    // ✅ VERIFY USER
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("✅ Login UID:", decoded.uid);

    // ✅ DATA-ONLY PAYLOAD (IMPORTANT)
    const message = {
      token: fcmToken,
      data: {
        title: "Login Successful",
        body: "Welcome to the DropDash.com 🎉",
        type: "login" // used for sound routing
      },
      android: {
        priority: "high"
      }
    };

    await admin.messaging().send(message);

    console.log("✅ Login notification sent");
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Notification failed:", err.message);
    res.status(401).json({ error: "Unauthorized" });
  }
});


// -------------------- PROMO RELEASE NOTIFICATION (DATA-ONLY) --------------------
app.post("/promo-release", async (req, res) => {
    console.log("Received promo-release request:", req.body);

    const { promoCode, discountPercent } = req.body;
    if (!promoCode || discountPercent == null) {
        return res.status(400).json({ error: "Missing data" });
    }

    try {
        // 1️⃣ Get all user FCM tokens
        const usersSnap = await admin.database().ref("users").once("value");
        const tokens = [];
        usersSnap.forEach(userSnap => {
            const token = userSnap.child("fcmToken").val();
            if (token) tokens.push(token);
        });

        if (tokens.length === 0) {
            return res.json({ success: true, message: "No users to notify" });
        }

        // 2️⃣ DATA-ONLY payload
 const multicastMessage = {
    tokens: tokens,   // array of FCM tokensnpm install

    data: {
        title: "New Promocode Released!",
        body: `Use ${promoCode} and get ${discountPercent}% off!`,
        type: "promo",
        promoCode,
        discountPercent: discountPercent.toString()
    },
    android: {
        priority: "high"
    }
};

const response = await admin.messaging().sendMulticast(multicastMessage);


        console.log(`✅ Promo notification sent: ${response.successCount}/${tokens.length}`);
        res.json({ success: true, sent: response.successCount });

    } catch (err) {
        console.error("❌ Promo notification failed:", err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
