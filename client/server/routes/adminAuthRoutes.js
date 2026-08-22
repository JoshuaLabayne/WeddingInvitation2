const express = require("express");

const router = express.Router();

/* =========================
   ADMIN LOGIN
========================= */

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      message: "Password is required.",
    });
  }

  if (
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      message: "Incorrect password.",
    });
  }

  const isProduction =
    process.env.NODE_ENV === "production";

  res.cookie("admin", "yes", {
    httpOnly: true,
    signed: true,

    secure: isProduction,

    sameSite: isProduction
      ? "none"
      : "lax",

    maxAge:
      8 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: "Login successful.",
  });
});

/* =========================
   CHECK ADMIN LOGIN
========================= */

router.get("/check", (req, res) => {
  if (
    req.signedCookies.admin === "yes"
  ) {
    return res.json({
      authenticated: true,
    });
  }

  return res.status(401).json({
    authenticated: false,
  });
});

/* =========================
   LOGOUT
========================= */

router.post("/logout", (req, res) => {
  const isProduction =
    process.env.NODE_ENV === "production";

  res.clearCookie("admin", {
    httpOnly: true,

    signed: true,

    secure: isProduction,

    sameSite: isProduction
      ? "none"
      : "lax",
  });

  res.json({
    success: true,
  });
});

module.exports = router;