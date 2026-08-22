const express = require("express");

const router = express.Router();

/* =========================
   COOKIE CONFIGURATION
========================= */

const getCookieOptions = () => ({
  httpOnly: true,

  // Render uses HTTPS in production
  secure:
    process.env.NODE_ENV === "production",

  // Required when frontend/backend
  // are served from different origins
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",

  signed: true,

  path: "/",

  maxAge:
    24 * 60 * 60 * 1000,
});

/* =========================
   ADMIN LOGIN
========================= */

router.post(
  "/login",
  (req, res) => {
    try {
      const {
        password,
      } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "Password is required.",
        });
      }

      if (
        password !==
        process.env.ADMIN_PASSWORD
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Incorrect password.",
        });
      }

      /*
       * Store a signed admin session
       * cookie in the browser.
       */
      res.cookie(
        "adminSession",
        "authenticated",
        getCookieOptions()
      );

      return res.status(200).json({
        success: true,
        message:
          "Admin login successful.",
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to log in.",
      });
    }
  }
);

/* =========================
   CHECK ADMIN SESSION
========================= */

router.get(
  "/check",
  (req, res) => {
    try {
      const adminSession =
        req.signedCookies
          ?.adminSession;

      console.log(
        "Admin session check:",
        adminSession
          ? "cookie received"
          : "no cookie"
      );

      if (
        adminSession !==
        "authenticated"
      ) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          message:
            "Unauthorized.",
        });
      }

      return res.status(200).json({
        success: true,
        authenticated: true,
      });
    } catch (error) {
      console.error(
        "Admin check error:",
        error
      );

      return res.status(500).json({
        success: false,
        authenticated: false,
        message:
          "Unable to verify admin session.",
      });
    }
  }
);

/* =========================
   ADMIN LOGOUT
========================= */

router.post(
  "/logout",
  (req, res) => {
    try {
      res.clearCookie(
        "adminSession",
        {
          httpOnly: true,

          secure:
            process.env
              .NODE_ENV ===
            "production",

          sameSite:
            process.env
              .NODE_ENV ===
            "production"
              ? "none"
              : "lax",

          path: "/",
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "Logged out successfully.",
      });
    } catch (error) {
      console.error(
        "Admin logout error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to log out.",
      });
    }
  }
);

module.exports = router;
