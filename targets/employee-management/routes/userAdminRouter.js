const {
  Router,
} = require(
  "express"
);

const {
  renderUserManagement,
  updateUserRoleController,
} = require(
  "../controllers/userAdminController"
);

const {
  requireAuth,
} = require(
  "../middleware/authMiddleware"
);

const {
  requireRole,
} = require(
  "../middleware/roleMiddleware"
);


const userAdminRouter =
  Router();


// ========================
// USER MANAGEMENT PAGE
// ADMIN ONLY
// ========================

userAdminRouter.get(
  "/admin/users",
  requireAuth,
  requireRole("admin"),
  renderUserManagement
);


// ========================
// UPDATE USER ROLE
// ADMIN ONLY
// ========================

userAdminRouter.post(
  "/admin/users/role",
  requireAuth,
  requireRole("admin"),
  updateUserRoleController
);


// ========================
// EXPORTS
// ========================

module.exports =
  userAdminRouter;