const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const inviteRoutes = require("./routes/inviteRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");

const app = express();

/* =========================
   TRUST RENDER PROXY
========================= */

// Useful when using secure cookies behind Render's HTTPS proxy.
app.set("trust proxy", 1);

/* =========================
   SECURITY
========================= */

app.use(helmet());

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "http://localhost:5173",

  // Production frontend
  "https://weddinginvitation2.onrender.com",

  // Optional environment variable
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Postman, curl, server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    // Required for cookies
    credentials: true,
  })
);

/* =========================
   BODY PARSER
========================= */

app.use(express.json());

/* =========================
   SIGNED COOKIES
========================= */

app.use(
  cookieParser(process.env.COOKIE_SECRET)
);

/* =========================
   TEST / HEALTH ROUTES
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Wedding Invitation API is running.",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/admin", adminAuthRoutes);
app.use("/api/invites", inviteRoutes);

/* =========================
   PORT
========================= */

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

/* =========================
   CHECK ENV VARIABLES
========================= */

const requiredEnvVariables = [
  "MONGODB_URI",
  "ADMIN_PASSWORD",
  "COOKIE_SECRET",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    console.error(
      `${variable} is missing from the environment variables.`
    );

    process.exit(1);
  }
}

/* =========================
   START SERVER
========================= */

async function startServer() {
  try {
    /* =========================
       CONNECT DATABASE
    ========================= */

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "MongoDB connected successfully"
    );

    /* =========================
       START EXPRESS
    ========================= */

    app.listen(PORT, HOST, () => {
      console.log(
        `Server running on ${HOST}:${PORT}`
      );

      console.log(
        `Frontend allowed: https://weddinginvitation2.onrender.com`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:"
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();
