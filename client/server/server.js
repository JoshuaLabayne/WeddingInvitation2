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
   REQUIRED ENV VARIABLES
========================= */

const requiredEnvVariables = [
  "MONGODB_URI",
  "ADMIN_PASSWORD",
  "COOKIE_SECRET",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    console.error(
      `❌ ${variable} is missing from environment variables.`
    );

    process.exit(1);
  }
}

/* =========================
   RENDER / HTTPS
========================= */

/*
 * Required because Render puts Express
 * behind its HTTPS reverse proxy.
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
   CORS
========================= */

const FRONTEND_URL =
  "https://weddinginvitation2.onrender.com";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * Allow requests without Origin,
       * such as Postman/curl.
       */
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(
        `❌ CORS blocked: ${origin}`
      );

      return callback(
        new Error(
          `Origin ${origin} is not allowed by CORS`
        )
      );
    },

    /*
     * Required because Admin.jsx and App.jsx
     * use credentials: "include".
     */
    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  })
);

/* =========================
   BODY PARSERS
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
 * IMPORTANT:
 *
 * adminAuthRoutes must access the session with:
 *
 * req.signedCookies.adminSession
 */
app.use(
  cookieParser(
    process.env.COOKIE_SECRET
  )
);

/* =========================
   SIMPLE REQUEST LOGGER
========================= */

app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl}`
  );

  next();
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Wedding Invitation API is running.",
  });
});

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      status: "healthy",
    });
  }
);

/* =========================
   ADMIN ROUTES
========================= */

app.use(
  "/api/admin",
  adminAuthRoutes
);

/* =========================
   INVITE ROUTES
========================= */

app.use(
  "/api/invites",
  inviteRoutes
);

/* =========================
   404
========================= */

app.use((req, res) => {
  return res.status(404).json({
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
      error
    );

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
   SERVER
========================= */

const PORT =
  process.env.PORT || 5000;

const HOST =
  "0.0.0.0";

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
          `✅ Frontend allowed: ${FRONTEND_URL}`
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error
    );

    process.exit(1);
  }
}

/* =========================
   MONGODB EVENTS
========================= */

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "❌ MongoDB error:",
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
