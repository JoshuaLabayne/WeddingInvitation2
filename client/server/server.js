const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const inviteRoutes = require("./routes/inviteRoutes");
const adminAuthRoutes = require(
  "./routes/adminAuthRoutes"
);

const app = express();

/* =========================
   SECURITY
========================= */

app.use(helmet());

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * Allow requests that do not
       * contain an Origin header.
       */
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    /*
     * REQUIRED so the browser
     * can send the admin cookie.
     */
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
  cookieParser(
    process.env.COOKIE_SECRET
  )
);

/* =========================
   ROUTES
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
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.send(
    "Wedding Invitation API is running."
  );
});

/* =========================
   PORT
========================= */

const PORT =
  process.env.PORT || 5000;

/* =========================
   CHECK ENV VARIABLES
========================= */

if (!process.env.MONGODB_URI) {
  console.error(
    "MONGODB_URI is missing from your .env file."
  );

  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD) {
  console.error(
    "ADMIN_PASSWORD is missing from your .env file."
  );

  process.exit(1);
}

if (!process.env.COOKIE_SECRET) {
  console.error(
    "COOKIE_SECRET is missing from your .env file."
  );

  process.exit(1);
}

/* =========================
   CONNECT DATABASE
========================= */

mongoose
  .connect(
    process.env.MONGODB_URI
  )
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:"
    );

    console.error(error);
  });