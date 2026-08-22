const express = require("express");
const crypto = require("crypto");

const router = express.Router();

/* =========================
   CONFIG
========================= */

const TOKEN_LIFETIME =
  24 * 60 * 60 * 1000;

/* =========================
   CREATE ADMIN TOKEN
========================= */

function createAdminToken() {
  const payload = {
    role: "admin",

    expiresAt:
      Date.now() +
      TOKEN_LIFETIME,

    nonce:
      crypto
        .randomBytes(16)
        .toString("hex"),
  };

  const encodedPayload =
    Buffer
      .from(
        JSON.stringify(payload)
      )
      .toString("base64url");

  const signature =
    crypto
      .createHmac(
        "sha256",
        process.env.COOKIE_SECRET
      )
      .update(encodedPayload)
      .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/* =========================
   VERIFY ADMIN TOKEN
========================= */

function verifyAdminToken(token) {
  try {
    if (!token) {
      console.log(
        "❌ No token provided"
      );

      return false;
    }

    const parts =
      token.split(".");

    if (parts.length !== 2) {
      console.log(
        "❌ Invalid token format"
      );

      return false;
    }

    const [
      encodedPayload,
      providedSignature,
    ] = parts;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.COOKIE_SECRET
        )
        .update(encodedPayload)
        .digest("base64url");

    const providedBuffer =
      Buffer.from(
        providedSignature,
        "utf8"
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    if (
      providedBuffer.length !==
      expectedBuffer.length
    ) {
      console.log(
        "❌ Signature length mismatch"
      );

      return false;
    }

    const validSignature =
      crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer
      );

    if (!validSignature) {
      console.log(
        "❌ Invalid token signature"
      );

      return false;
    }

    const payload =
      JSON.parse(
        Buffer
          .from(
            encodedPayload,
            "base64url"
          )
          .toString("utf8")
      );

    if (
      payload.role !== "admin"
    ) {
      console.log(
        "❌ Invalid token role"
      );

      return false;
    }

    if (
      !payload.expiresAt ||
      Date.now() >
        payload.expiresAt
    ) {
      console.log(
        "❌ Admin token expired"
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Token verification error:",
      error
    );

    return false;
  }
}

/* =========================
   GET BEARER TOKEN
========================= */

function getBearerToken(req) {
  const authorization =
    req.headers.authorization;

  console.log(
    "Authorization header:",
    authorization
      ? "Bearer token received"
      : "NO AUTHORIZATION HEADER"
  );

  if (!authorization) {
    return null;
  }

  const [
    type,
    token,
  ] = authorization.split(" ");

  if (
    type !== "Bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

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
        return res
          .status(400)
          .json({
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

        return res
          .status(401)
          .json({
            success: false,
            message:
              "Incorrect password.",
          });
      }

      const token =
        createAdminToken();

      console.log(
        "✅ Admin login successful"
      );

      return res
        .status(200)
        .json({
          success: true,
          authenticated: true,
          token,
          message:
            "Login successful.",
        });
    } catch (error) {
      console.error(
        "❌ Admin login error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to log in.",
        });
    }
  }
);

/* =========================
   CHECK ADMIN
========================= */

router.get(
  "/check",
  (req, res) => {
    try {
      const token =
        getBearerToken(req);

      if (
        !verifyAdminToken(token)
      ) {
        console.log(
          "❌ Admin authentication failed"
        );

        return res
          .status(401)
          .json({
            success: false,
            authenticated: false,
            message:
              "Unauthorized.",
          });
      }

      console.log(
        "✅ Admin token verified"
      );

      return res
        .status(200)
        .json({
          success: true,
          authenticated: true,
        });
    } catch (error) {
      console.error(
        "❌ Admin check error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          authenticated: false,
          message:
            "Unable to verify admin.",
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
    /*
     * No server-side session exists.
     * The frontend deletes adminToken
     * from sessionStorage.
     */

    return res
      .status(200)
      .json({
        success: true,
        authenticated: false,
        message:
          "Logged out successfully.",
      });
  }
);

/* =========================
   EXPORT HELPERS
========================= */

router.verifyAdminToken =
  verifyAdminToken;

router.getBearerToken =
  getBearerToken;

/* =========================
   EXPORT ROUTER
========================= */

module.exports = router;
