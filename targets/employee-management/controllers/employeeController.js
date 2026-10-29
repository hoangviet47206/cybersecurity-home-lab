const db =
  require("../models/queries");

const {
  createAuditLog,
} = require("../models/auditQueries");


// ========================
// SAFE AUDIT LOG
// ========================

async function writeAuditLog(
  data
) {
  try {

    await createAuditLog(
      data
    );

  } catch (error) {

    console.error(
      "Audit log error:",
      error
    );

  }
}


// ========================
// RENDER EMPLOYEE PAGE
// ========================

const renderEmployee =
  async (req, res) => {

    try {

      const page =
        parseInt(
          req.query.page,
          10
        ) || 1;


      const filters = {

        employeeNumber:
          req.query.employeeNumber ||
          "",

        lastName:
          req.query.lastName ||
          "",

        firstName:
          req.query.firstName ||
          "",

        extension:
          req.query.extension ||
          "",

        email:
          req.query.email ||
          "",

        officeCode:
          req.query.officeCode ||
          "",

        reportsTo:
          req.query.reportsTo ||
          "",

        jobTitle:
          req.query.jobTitle ||
          "",
      };


      const isFiltering =
        Object.values(
          filters
        ).some(
          (value) =>
            value
        );


      let employees;

      let totalItems;


      if (isFiltering) {

        employees =
          await db.getEmployees(
            page,
            filters
          );


        totalItems =
          await db.getEmployeeCount(
            filters
          );

      } else {

        employees =
          await db.getEmployees(
            page
          );


        totalItems =
          await db.getEmployeeCount();

      }


      const totalPages =
        Math.ceil(
          totalItems /
          db.PAGE_SIZE
        );


      return res.render(
        "employee-page",
        {
          employees,

          totalEmployees:
            totalItems,

          currentpage:
            page,

          totalPages,

          filters,
        }
      );

    } catch (error) {

      console.error(
        "Render employee error:",
        error
      );


      return res
        .status(500)
        .render(
          "error-page",
          {
            statusCode:
              500,

            title:
              "Unable to Load Employees",

            message:
              "The employee list could not be loaded. Please try again.",
          }
        );

    }
  };


// ========================
// VALIDATION HELPERS
// ========================

const validateEmail = (
  email
) => {

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  return regex.test(
    email
  );
};


const validateNumber = (
  value
) => {

  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    !Number.isNaN(
      Number(value)
    )
  );
};


// ========================
// ADD EMPLOYEE
// ========================

const addEmployee =
  async (req, res) => {

    const {
      employeeNumber,
      lastName,
      firstName,
      extension,
      email,
      officeCode,
      reportsTo,
      jobTitle,
    } = req.body;


    // Employee Number

    if (
      !employeeNumber ||
      !validateNumber(
        employeeNumber
      )
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Employee",

            message:
              "Employee number is invalid.",
          }
        );

    }


    // Last Name

    if (
      !lastName ||
      lastName.length > 50
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Employee",

            message:
              "Last name is invalid.",
          }
        );

    }


    // First Name

    if (
      !firstName ||
      firstName.length > 50
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Employee",

            message:
              "First name is invalid.",
          }
        );

    }


    // Job Title

    if (
      !jobTitle ||
      jobTitle.length > 50
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Employee",

            message:
              "Job title is invalid.",
          }
        );

    }


    // Email

    if (
      !email ||
      !validateEmail(
        email
      )
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Email",

            message:
              "Please enter a valid email address.",
          }
        );

    }


    // Extension

    if (
      extension &&
      extension.length > 10
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Extension",

            message:
              "Extension is too long.",
          }
        );

    }


    // Office Code

    if (
      officeCode &&
      officeCode.length > 10
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Office Code",

            message:
              "Office code is too long.",
          }
        );

    }


    // Reports To

    if (
      reportsTo &&
      !validateNumber(
        reportsTo
      )
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Manager",

            message:
              "Reports To must be a valid employee number.",
          }
        );

    }


    try {

      await db.addNewEmployee({
        employeeNumber:
          Number(
            employeeNumber
          ),

        lastName,

        firstName,

        extension,

        email,

        officeCode,

        reportsTo:
          reportsTo
            ? Number(
                reportsTo
              )
            : null,

        jobTitle,
      });


      // ========================
      // AUDIT: CREATE
      // ========================

      const currentUser =
        req.session.user;


      await writeAuditLog({
        userId:
          currentUser
            ? currentUser.id
            : null,

        username:
          currentUser
            ? currentUser.username
            : null,

        action:
          "EMPLOYEE_CREATED",

        target:
          `employee:${employeeNumber}`,

        ipAddress:
          req.ip,
      });


      return res.redirect(
        "/employees"
      );

    } catch (error) {

      console.error(
        "Add employee error:",
        error
      );


      return res
        .status(500)
        .render(
          "error-page",
          {
            statusCode:
              500,

            title:
              "Unable to Add Employee",

            message:
              error.message ||
              "The employee could not be added.",
          }
        );

    }
  };


// ========================
// UPDATE EMPLOYEE
// ========================

const updateEmployee =
  async (req, res) => {

    const employeeNumber =
      parseInt(
        req.body.employeeNumber,
        10
      );


    if (
      !employeeNumber
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Employee",

            message:
              "Employee number is invalid.",
          }
        );

    }


    const {
      lastName,
      firstName,
      extension,
      email,
      officeCode,
      reportsTo,
      jobTitle,
    } = req.body;


    if (
      lastName &&
      lastName.length > 50
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Last Name",

            message:
              "Last name is too long.",
          }
        );

    }


    if (
      firstName &&
      firstName.length > 50
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid First Name",

            message:
              "First name is too long.",
          }
        );

    }


    if (
      jobTitle &&
      jobTitle.length > 50
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Job Title",

            message:
              "Job title is too long.",
          }
        );

    }


    if (
      email &&
      !validateEmail(
        email
      )
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Email",

            message:
              "Please enter a valid email address.",
          }
        );

    }


    if (
      extension &&
      extension.length > 10
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Extension",

            message:
              "Extension is too long.",
          }
        );

    }


    if (
      officeCode &&
      officeCode.length > 10
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Office Code",

            message:
              "Office code is too long.",
          }
        );

    }


    if (
      reportsTo &&
      !validateNumber(
        reportsTo
      )
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Manager",

            message:
              "Reports To must be a valid employee number.",
          }
        );

    }


    const updateData = {
      employeeNumber,

      lastName,

      firstName,

      extension,

      email,

      officeCode,

      reportsTo:
        reportsTo
          ? Number(
              reportsTo
            )
          : null,

      jobTitle,
    };


    try {

      await db.updateEmployee(
        updateData
      );


      // ========================
      // AUDIT: UPDATE
      // ========================

      const currentUser =
        req.session.user;


      await writeAuditLog({
        userId:
          currentUser
            ? currentUser.id
            : null,

        username:
          currentUser
            ? currentUser.username
            : null,

        action:
          "EMPLOYEE_UPDATED",

        target:
          `employee:${employeeNumber}`,

        ipAddress:
          req.ip,
      });


      return res.redirect(
        "/employees"
      );

    } catch (error) {

      console.error(
        "Update employee error:",
        error
      );


      return res
        .status(500)
        .render(
          "error-page",
          {
            statusCode:
              500,

            title:
              "Unable to Update Employee",

            message:
              error.message ||
              "The employee could not be updated.",
          }
        );

    }
  };


// ========================
// DELETE EMPLOYEE
// ========================

const deleteEmployee =
  async (req, res) => {

    const employeeNumber =
      parseInt(
        req.body.employeeNumber,
        10
      );


    if (
      !employeeNumber
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid Employee",

            message:
              "Employee number is invalid.",
          }
        );

    }


    try {

      await db.deleteEmployee(
        employeeNumber
      );


      // ========================
      // AUDIT: DELETE
      // ========================

      const currentUser =
        req.session.user;


      await writeAuditLog({
        userId:
          currentUser
            ? currentUser.id
            : null,

        username:
          currentUser
            ? currentUser.username
            : null,

        action:
          "EMPLOYEE_DELETED",

        target:
          `employee:${employeeNumber}`,

        ipAddress:
          req.ip,
      });


      return res.redirect(
        "/employees"
      );

    } catch (error) {

      console.error(
        "Delete employee error:",
        error
      );


      return res
        .status(500)
        .render(
          "error-page",
          {
            statusCode:
              500,

            title:
              "Unable to Delete Employee",

            message:
              error.message ||
              "The employee could not be deleted.",
          }
        );

    }
  };


// ========================
// EXPORTS
// ========================

module.exports = {
  renderEmployee,
  addEmployee,
  updateEmployee,
  deleteEmployee,
};