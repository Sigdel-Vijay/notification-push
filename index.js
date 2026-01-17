/**
 * DropDash Backend - Login Success Notification
 */

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30
});

// 🔐 LOAD SERVICE ACCOUNT FROM ENV
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.get("/", (req, res) => {
  res.send("DropDash backend running ✅");
});

app.post("/login-success", loginLimiter, async (req, res) => {

  const { fcmToken, idToken } = req.body;

  if (!fcmToken || !idToken) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "Login Successful",
        body: "Your DropDash account was logged in"
      },
      android: { priority: "high" }
    });

    res.json({ success: true });

  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Backend running"));
