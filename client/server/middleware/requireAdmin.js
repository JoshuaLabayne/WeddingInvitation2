function requireAdmin(req, res, next) {
  const adminCookie =
    req.signedCookies.admin;

  if (adminCookie !== "yes") {
    return res.status(401).json({
      message: "Admin access required.",
    });
  }

  next();
}

module.exports = requireAdmin;