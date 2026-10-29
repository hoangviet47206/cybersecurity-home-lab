const {
  getAuditLogs,
} = require(
  "../models/auditQueries"
);


// ========================
// RENDER AUDIT LOG PAGE
// ========================

async function renderAuditLogs(
  req,
  res
) {
  try {

    const logs =
      await getAuditLogs(
        200
      );


    return res.render(
      "audit-page",
      {
        logs,
      }
    );

  } catch (error) {

    console.error(
      "Render audit logs error:",
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
            "Unable to Load Audit Logs",

          message:
            "The audit log history could not be loaded. Please try again.",
        }
      );
  }
}


// ========================
// EXPORTS
// ========================

module.exports = {
  renderAuditLogs,
};