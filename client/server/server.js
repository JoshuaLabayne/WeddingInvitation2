const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const inviteRoutes = require("./routes/inviteRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");

/* =========================
   APP
========================= */

const app = express();

/* =========================
   ENVIRONMENT VARIABLES
========================= */

const requiredEnvVariables = [
  "MONGODB_URI",
  "ADMIN_PASSWORD",
  "COOKIE_SECRET",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    console.error(
      `❌ ${variable} is missing from the environment variables.`
    );

    process.exit(1);
  }
}

/* =========================
   TRUST RENDER PROXY
========================= */

/*
 * Render terminates HTTPS before forwarding
 * requests to your Express server.
 *
 * This allows Express to correctly recognize
 * secure HTTPS requests and secure cookies.
 */
app.set("trust proxy", 1);

/* =========================
   SECURITY
========================= */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* =========================
   FRONTEND URLS
========================= */

const PRODUCTION_FRONTEND =
  "https://weddinginvitation2.onrender.com";

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    PRODUCTION_FRONTEND,
    process.env.CLIENT_URL,
  ].filter(Boolean)
);

/* =========================
   CORS CONFIGURATION
========================= */

const corsOptions = {
  origin: (origin, callback) => {
    /*
     * Requests made directly through
     * Postman/curl may have no Origin.
     */
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.error(
      `❌ CORS blocked origin: ${origin}`
    );

    return callback(
      new Error(
        `Origin ${origin} is not allowed by CORS`
      )
    );
  },

  /*
   * VERY IMPORTANT:
   * Allows browser cookies to travel
   * between the frontend and backend.
   */
  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

/* =========================
   BODY PARSER
========================= */

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/* =========================
   SIGNED COOKIES
========================= */

/*
 * adminAuthRoutes should read cookies using:
 *
 * req.signedCookies.adminSession
 */
app.use(
  cookieParser(
    process.env.COOKIE_SECRET
  )
);

/* =========================
   REQUEST LOGGING
========================= */

/*
 * Helpful while debugging Render.
 * Does NOT print passwords or cookies.
 */
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path}`
  );

  next();
});

/* =========================
   HEALTH ROUTES
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Wedding Invitation API is running.",
  });
});

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      status: "healthy",
      environment:
        process.env.NODE_ENV ||
        "production",
    });
  }
);

/* =========================
   API ROUTES
========================= */

app.use(
  "/api/admin",
  adminAuthRoutes
);

app.use(
  "/api/invites",
  inviteRoutes
);

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Express error:",
      error.message
    );

    /*
     * Handle CORS failures cleanly.
     */
    if (
      error.message?.includes(
        "not allowed by CORS"
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Request origin is not allowed.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error.",
    });
  }
);

/* =========================
   SERVER CONFIGURATION
========================= */

const PORT =
  process.env.PORT || 5000;

const HOST = "0.0.0.0";

/* =========================
   START SERVER
========================= */

async function startServer() {
  try {
    console.log(
      "Connecting to MongoDB..."
    );

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "✅ MongoDB connected successfully"
    );

    app.listen(
      PORT,
      HOST,
      () => {
        console.log(
          `✅ Server running on ${HOST}:${PORT}`
        );

        console.log(
          `✅ Frontend allowed: ${PRODUCTION_FRONTEND}`
        );

        if (
          process.env.CLIENT_URL
        ) {
          console.log(
            `✅ CLIENT_URL: ${process.env.CLIENT_URL}`
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "❌ Failed to start server:"
    );

    console.error(error);

    process.exit(1);
  }
}

/* =========================
   DATABASE EVENTS
========================= */

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "❌ MongoDB connection error:",
      error
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.warn(
      "⚠️ MongoDB disconnected"
    );
  }
);

/* =========================
   START
========================= */

startServer();
