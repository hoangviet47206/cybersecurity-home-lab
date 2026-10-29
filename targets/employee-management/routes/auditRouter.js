const {
  Router,
} = require(
  "express"
);

const {
  renderAuditLogs,
} = require(
  "../controllers/auditController"
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


const auditRouter =
  Router();


// ========================
// AUDIT LOG PAGE
// ADMIN ONLY
// ========================

auditRouter.get(
  "/audit-logs",
  requireAuth,
  requireRole("admin"),
  renderAuditLogs
);


// ========================
// EXPORTS
// ========================

module.exports =
  auditRouter;