const { Router } = require("express");

const {
  registerUser,
  loginUser,
  logoutUser,
} = require("../controllers/authController");

const {
  loginLimiter,
  registerLimiter,
} = require("../middleware/rateLimitMiddleware");


const authRouter = Router();


// ========================
// WELCOME PAGE
// ========================

authRouter.get(
  "/",
  (req, res) => {

    res.render(
      "welcome"
    );
  }
);


// ========================
// LOGIN PAGE
// ========================

authRouter.get(
  "/login",
  (req, res) => {

    const registered =
      req.query.registered ===
      "1";


    res.render(
      "login",
      {
        error: null,

        username: "",

        success:
          registered
            ? "Account created successfully. You can now sign in."
            : null,
      }
    );
  }
);


// ========================
// LOGIN
// RATE LIMITED
// ========================

authRouter.post(
  "/login",
  loginLimiter,
  loginUser
);


// ========================
// REGISTER PAGE
// ========================

authRouter.get(
  "/register",
  (req, res) => {

    res.render(
      "register",
      {
        error: null,

        formData: {
          username: "",
          email: "",
        },
      }
    );
  }
);


// ========================
// REGISTER
// RATE LIMITED
// ========================

authRouter.post(
  "/register",
  registerLimiter,
  registerUser
);


// ========================
// LOGOUT
// ========================

authRouter.post(
  "/logout",
  logoutUser
);


module.exports =
  authRouter;