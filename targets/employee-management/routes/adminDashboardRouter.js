const {
  Router,
} = require(
  "express"
);

const {
  renderAdminDashboard,
} = require(
  "../controllers/adminDashboardController"
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


const adminDashboardRouter =
  Router();


adminDashboardRouter.get(
  "/admin/dashboard",
  requireAuth,
  requireRole("admin"),
  renderAdminDashboard
);


module.exports =
  adminDashboardRouter;