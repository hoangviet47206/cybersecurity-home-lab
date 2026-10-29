const {
  getAllUsers,
  findUserById,
  updateUserRole,
} = require(
  "../models/userQueries"
);

const {
  createAuditLog,
} = require(
  "../models/auditQueries"
);


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
// RENDER USER MANAGEMENT
// ========================

async function renderUserManagement(
  req,
  res
) {
  try {

    const users =
      await getAllUsers();


    return res.render(
      "admin-users",
      {
        users,
      }
    );

  } catch (error) {

    console.error(
      "Render users error:",
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
            "Unable to Load Users",

          message:
            "The user list could not be loaded. Please try again.",
        }
      );
  }
}


// ========================
// UPDATE USER ROLE
// ========================

async function updateUserRoleController(
  req,
  res
) {
  try {

    const userId =
      parseInt(
        req.body.userId,
        10
      );

    const {
      role,
    } = req.body;


    // ========================
    // VALIDATE USER ID
    // ========================

    if (!userId) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Invalid User",

            message:
              "The selected user is invalid.",
          }
        );
    }


    // ========================
    // VALIDATE ROLE
    // ========================

    const allowedRoles = [
      "employee",
      "manager",
      "admin",
    ];


    if (
      !allowedRoles.includes(
        role
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
              "Invalid Role",

            message:
              "The selected role is not valid.",
          }
        );
    }


    // ========================
    // FIND TARGET USER
    // ========================

    const targetUser =
      await findUserById(
        userId
      );


    if (!targetUser) {

      return res
        .status(404)
        .render(
          "error-page",
          {
            statusCode:
              404,

            title:
              "User Not Found",

            message:
              "The selected user does not exist.",
          }
        );
    }


    // ========================
    // PREVENT SELF DEMOTION
    // ========================

    const currentUser =
      req.session.user;


    if (
      currentUser &&
      currentUser.id ===
        userId &&
      role !== "admin"
    ) {

      return res
        .status(400)
        .render(
          "error-page",
          {
            statusCode:
              400,

            title:
              "Role Change Blocked",

            message:
              "You cannot remove your own admin role.",
          }
        );
    }


    // ========================
    // NO CHANGE
    // ========================

    if (
      targetUser.role ===
      role
    ) {

      return res.redirect(
        "/admin/users"
      );
    }


    const oldRole =
      targetUser.role;


    // ========================
    // UPDATE ROLE
    // ========================

    await updateUserRole(
      userId,
      role
    );


    // ========================
    // AUDIT LOG
    // ========================

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
        "USER_ROLE_UPDATED",

      target:
        `user:${targetUser.username} (${oldRole} -> ${role})`,

      ipAddress:
        req.ip,
    });


    return res.redirect(
      "/admin/users"
    );

  } catch (error) {

    console.error(
      "Update user role error:",
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
            "Unable to Update User",

          message:
            "The user role could not be updated. Please try again.",
        }
      );
  }
}


// ========================
// EXPORTS
// ========================

module.exports = {
  renderUserManagement,
  updateUserRoleController,
};