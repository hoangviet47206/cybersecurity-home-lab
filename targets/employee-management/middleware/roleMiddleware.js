function requireRole(
  ...allowedRoles
) {

  return (
    req,
    res,
    next
  ) => {

    if (
      !req.session.user
    ) {
      return res.redirect(
        "/login"
      );
    }


    const userRole =
      req.session.user.role;


    if (
      !allowedRoles.includes(
        userRole
      )
    ) {

      return res
        .status(403)
        .render(
          "error-page",
          {
            statusCode: 403,

            title:
              "Access Denied",

            message:
              "You do not have permission to perform this action.",
          }
        );
    }


    next();
  };
}


module.exports = {
  requireRole,
};