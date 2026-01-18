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
  credential: admin.credential.cert(serviceAccount)
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
        body: "Welcome back to DropDash 🎉",
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

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
