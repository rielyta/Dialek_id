
const { auth } = require("../config/firebaseAdmin");

async function authMiddleware(req, res, next) {
  const headerAuth = req.headers.authorization || "";

  if (!headerAuth.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Header Authorization: Bearer <idToken> wajib diisi.",
    });
  }

  const idToken = headerAuth.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken; 
    next();
  } catch (err) {
    console.error("[authMiddleware] Token tidak valid:", err.message);
    return res.status(401).json({
      error: "Unauthorized",
      message: "ID Token tidak valid atau sudah kedaluwarsa.",
    });
  }
}

module.exports = authMiddleware;