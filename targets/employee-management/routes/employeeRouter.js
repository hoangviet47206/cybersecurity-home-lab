const { Router } = require("express");

const {
  renderEmployee,
  addEmployee,
  deleteEmployee,
  updateEmployee,
} = require("../controllers/employeeController");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

const {
  requireRole,
} = require("../middleware/roleMiddleware");


const employeeRouter = Router();


// ========================
// EMPLOYEE PAGE
// ========================

employeeRouter.get(
  "/employees",
  requireAuth,
  renderEmployee
);


// ========================
// ADD EMPLOYEE
// MANAGER / ADMIN
// ========================

employeeRouter.post(
  "/employees/add",
  requireAuth,
  requireRole(
    "manager",
    "admin"
  ),
  addEmployee
);


// ========================
// UPDATE EMPLOYEE
// MANAGER / ADMIN
// ========================

employeeRouter.post(
  "/employees/update",
  requireAuth,
  requireRole(
    "manager",
    "admin"
  ),
  updateEmployee
);


// ========================
// DELETE EMPLOYEE
// ADMIN ONLY
// ========================

employeeRouter.post(
  "/employees/delete",
  requireAuth,
  requireRole(
    "admin"
  ),
  deleteEmployee
);


module.exports =
  employeeRouter;