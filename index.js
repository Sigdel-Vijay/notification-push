/**
 * DropDash Backend - Login Success Notification
 * Fully Free + Production Safe
 */

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// -------------------- APP SETUP --------------------
const app = express();
app.use(cors());
app.use(express.json());

// -------------------- RATE LIMIT (ANTI ABUSE) --------------------
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,                // 30 requests per minute per IP
  message: { error: "Too many requests" }
});

// -------------------- FIREBASE ADMIN INIT --------------------
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json"))
});

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.send("DropDash backend running ✅");
});

// -------------------- LOGIN SUCCESS NOTIFICATION --------------------
app.post("/login-success", loginLimiter, async (req, res) => {

  const { fcmToken, idToken } = req.body;

  if (!fcmToken || !idToken) {
    return res.status(400).json({
      error: "Missing fcmToken or idToken"
    });
  }

  try {
    // 🔐 VERIFY FIREBASE USER
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // (Optional) Log for debugging
    console.log("Login notification for UID:", uid);

    // 🔔 PUSH NOTIFICATION PAYLOAD
    const message = {
      token: fcmToken,
      notification: {
        title: "Login Successful",
        body: "Your DropDash account was logged in successfully"
      },
      android: {
        priority: "high"
      }
    };

    // SEND NOTIFICATION
    await admin.messaging().send(message);

    return res.json({ success: true });

  } catch (error) {
    console.error("Login notification error:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// -------------------- SERVER START --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 DropDash backend running on port ${PORT}`);
});
