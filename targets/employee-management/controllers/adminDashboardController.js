
const employeeDb =
  require("../models/queries");

const userDb =
  require("../models/userQueries");

const auditDb =
  require("../models/auditQueries");


// ========================
// HELPER:
// BUILD LAST 7 DAYS
// ========================

function buildLast7Days(
  auditRows
) {
  const result = [];

  const today =
    new Date();


  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const date =
      new Date(
        today
      );

    date.setDate(
      today.getDate() -
      i
    );


    const dateKey =
      date
        .toISOString()
        .slice(
          0,
          10
        );


    const found =
      auditRows.find(
        (row) => {

          const rowDate =
            new Date(
              row.event_date
            )
              .toISOString()
              .slice(
                0,
                10
              );


          return (
            rowDate ===
            dateKey
          );
        }
      );


    result.push({
      date:
        dateKey,

      label:
        date.toLocaleDateString(
          "en-US",
          {
            weekday:
              "short",
          }
        ),

      count:
        found
          ? Number(
              found.count
            )
          : 0,
    });
  }


  return result;
}


// ========================
// RENDER ADMIN DASHBOARD
// ========================

async function renderAdminDashboard(
  req,
  res
) {
  try {

    const [
      totalEmployees,
      employeesByOffice,

      totalUsers,
      usersByRole,
      managerCount,
      adminCount,

      failedLoginCount,
      auditByAction,
      auditLast7DaysRaw,
      recentEvents,
      todayAuditCount,
    ] =
      await Promise.all([

        employeeDb
          .getEmployeeCount(),

        employeeDb
          .getEmployeesByOffice(),


        userDb
          .getUserCount(),

        userDb
          .getUsersByRole(),

        userDb
          .getRoleCount(
            "manager"
          ),

        userDb
          .getRoleCount(
            "admin"
          ),


        auditDb
          .getFailedLoginCount(),

        auditDb
          .getAuditLogsByAction(),

        auditDb
          .getAuditActivityLast7Days(),

        auditDb
          .getRecentAuditLogs(
            5
          ),

        auditDb
          .getTodayAuditCount(),
      ]);


    const auditLast7Days =
      buildLast7Days(
        auditLast7DaysRaw
      );


    // ========================
    // NORMALIZE USER ROLES
    // ========================

    const roleData = {
      employee: 0,
      manager: 0,
      admin: 0,
    };


    usersByRole.forEach(
      (row) => {

        if (
          Object.prototype
            .hasOwnProperty.call(
              roleData,
              row.role
            )
        ) {

          roleData[
            row.role
          ] =
            Number(
              row.count
            );

        }
      }
    );


    // ========================
    // RENDER
    // ========================

    return res.render(
      "admin-dashboard",
      {
        stats: {
          totalEmployees:
            Number(
              totalEmployees
            ),

          totalUsers:
            Number(
              totalUsers
            ),

          managerCount:
            Number(
              managerCount
            ),

          adminCount:
            Number(
              adminCount
            ),

          failedLoginCount:
            Number(
              failedLoginCount
            ),

          todayAuditCount:
            Number(
              todayAuditCount
            ),
        },


        roleData,

        employeesByOffice,

        auditByAction,

        auditLast7Days,

        recentEvents,
      }
    );

  } catch (error) {

    console.error(
      "Render admin dashboard error:",
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
            "Unable to Load Dashboard",

          message:
            "The admin dashboard could not be loaded.",
        }
      );
  }
}


// ========================
// EXPORTS
// ========================

module.exports = {
  renderAdminDashboard,
};
