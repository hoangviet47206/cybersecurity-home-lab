const {
  rateLimit,
} = require(
  "express-rate-limit"
);


// ========================
// LOGIN LIMITER
// ========================

const loginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 10,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    skipSuccessfulRequests:
      true,

    message:
      "Too many login attempts. Please try again later.",
  });


// ========================
// REGISTER LIMITER
// ========================

const registerLimiter =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit: 10,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message:
      "Too many registration attempts. Please try again later.",
  });


module.exports = {
  loginLimiter,
  registerLimiter,
};