const express = require("express");

const router = express.Router();

/* =========================
   COOKIE SETTINGS
========================= */

const COOKIE_NAME = "adminSession";

const getCookieOptions = () => {
  const isProduction =
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,

    /*
     * Render uses HTTPS.
     */
    secure: isProduction,

    /*
     * Frontend and backend are on
     * different origins.
     */
    sameSite: isProduction
      ? "none"
      : "lax",

    /*
     * cookie-parser will sign the cookie
     * using COOKIE_SECRET.
     */
    signed: true,

    path: "/",

    maxAge:
      24 * 60 * 60 * 1000,
  };
};

/* =========================
   LOGIN
========================= */

router.post(
  "/login",
  (req, res) => {
    try {
      const { password } =
        req.body;

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
        console.log(
          "❌ Incorrect admin password"
        );

        return res.status(401).json({
          success: false,
          message:
            "Incorrect password.",
        });
      }

      /*
       * Create signed session cookie.
       */
      res.cookie(
        COOKIE_NAME,
        "authenticated",
        getCookieOptions()
      );

      console.log(
        "✅ Admin logged in — session cookie created"
      );

      return res.status(200).json({
        success: true,
        authenticated: true,
        message:
          "Login successful.",
      });
    } catch (error) {
      console.error(
        "❌ Admin login error:",
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
   CHECK SESSION
========================= */

router.get(
  "/check",
  (req, res) => {
    try {
      /*
       * Because the cookie was created
       * with signed: true, read it from
       * req.signedCookies.
       */
      const adminSession =
        req.signedCookies?.[
          COOKIE_NAME
        ];

      console.log(
        "Admin session:",
        adminSession
      );

      if (
        adminSession !==
        "authenticated"
      ) {
        console.log(
          "❌ Admin session not valid"
        );

        return res.status(401).json({
          success: false,
          authenticated: false,
          message:
            "Unauthorized.",
        });
      }

      console.log(
        "✅ Admin session valid"
      );

      return res.status(200).json({
        success: true,
        authenticated: true,
      });
    } catch (error) {
      console.error(
        "❌ Admin session check error:",
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
   LOGOUT
========================= */

router.post(
  "/logout",
  (req, res) => {
    try {
      const isProduction =
        process.env.NODE_ENV ===
        "production";

      res.clearCookie(
        COOKIE_NAME,
        {
          httpOnly: true,

          secure:
            isProduction,

          sameSite:
            isProduction
              ? "none"
              : "lax",

          path: "/",
        }
      );

      console.log(
        "✅ Admin logged out"
      );

      return res.status(200).json({
        success: true,
        authenticated: false,
        message:
          "Logged out successfully.",
      });
    } catch (error) {
      console.error(
        "❌ Logout error:",
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
