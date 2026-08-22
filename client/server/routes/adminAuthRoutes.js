const express = require("express");
const crypto = require("crypto");

const router = express.Router();

/* =========================
   CONFIG
========================= */

const TOKEN_LIFETIME =
  24 * 60 * 60 * 1000;

/* =========================
   CREATE TOKEN
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
   VERIFY TOKEN
========================= */

function verifyAdminToken(token) {
  try {
    if (!token) {
      return false;
    }

    const [
      encodedPayload,
      providedSignature,
    ] = token.split(".");

    if (
      !encodedPayload ||
      !providedSignature
    ) {
      return false;
    }

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
        providedSignature
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature
      );

    if (
      providedBuffer.length !==
      expectedBuffer.length
    ) {
      return false;
    }

    const signatureValid =
      crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer
      );

    if (!signatureValid) {
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
      return false;
    }

    if (
      !payload.expiresAt ||
      Date.now() >
        payload.expiresAt
    ) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Token verification error:",
      error
    );

    return false;
  }
}

/* =========================
   GET BEARER TOKEN
========================= */

function getAdminToken(req) {
  const authorization =
    req.headers.authorization;

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
        "Admin login error:",
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
   CHECK ADMIN SESSION
========================= */

router.get(
  "/check",
  (req, res) => {
    try {
      const token =
        getAdminToken(req);

      if (
        !verifyAdminToken(
          token
        )
      ) {
        console.log(
          "❌ Invalid admin token"
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
        "✅ Admin authenticated"
      );

      return res
        .status(200)
        .json({
          success: true,
          authenticated: true,
        });
    } catch (error) {
      console.error(
        "Admin check error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          authenticated: false,
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
     * With this authentication method
     * logout happens by deleting the
     * token from sessionStorage.
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
   EXPORT
========================= */

module.exports = router;
