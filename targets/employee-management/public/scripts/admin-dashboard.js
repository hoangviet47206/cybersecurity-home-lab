
const dashboardDataElement =
  document.getElementById(
    "dashboard-data"
  );

const dashboardData =
  JSON.parse(
    dashboardDataElement
      .dataset
      .dashboard
  );


Chart.defaults.font.family =
  "Inter, sans-serif";

Chart.defaults.color =
  "#667085";


// ========================
// USERS BY ROLE
// ========================

const roleCanvas =
  document.getElementById(
    "roleChart"
  );

new Chart(
  roleCanvas,
  {
    type: "doughnut",

    data: {
      labels: [
        "Employee",
        "Manager",
        "Admin",
      ],

      datasets: [
        {
          data: [
            dashboardData
              .roleData
              .employee,

            dashboardData
              .roleData
              .manager,

            dashboardData
              .roleData
              .admin,
          ],

          backgroundColor: [
            "#0ea5e9",
            "#f59e0b",
            "#4f46e5",
          ],

          borderWidth: 0,

          hoverOffset: 7,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio:
        false,

      cutout: "68%",

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            usePointStyle:
              true,

            pointStyle:
              "circle",

            padding: 18,
          },
        },
      },
    },
  }
);


// ========================
// EMPLOYEES BY OFFICE
// ========================

const officeCanvas =
  document.getElementById(
    "officeChart"
  );

new Chart(
  officeCanvas,
  {
    type: "bar",

    data: {
      labels:
  dashboardData
    .employeesByOffice
    .map(
      (item) =>
        item.officeName ||
        `Office ${item.officeCode}`
    ),

      datasets: [
        {
          label: "Employees",

          data:
            dashboardData
              .employeesByOffice
              .map(
                (item) =>
                  Number(
                    item.count
                  )
              ),

          backgroundColor:
            "#6366f1",

          borderRadius: 8,

          maxBarThickness: 54,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio:
        false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero:
            true,

          ticks: {
            precision: 0,
          },

          grid: {
            color:
              "rgba(148, 163, 184, 0.14)",
          },
        },

        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  }
);


// ========================
// AUDIT ACTIVITY
// ========================

const activityCanvas =
  document.getElementById(
    "auditActivityChart"
  );

new Chart(
  activityCanvas,
  {
    type: "line",

    data: {
      labels:
        dashboardData
          .auditLast7Days
          .map(
            (item) =>
              item.label
          ),

      datasets: [
        {
          label:
            "Security Events",

          data:
            dashboardData
              .auditLast7Days
              .map(
                (item) =>
                  Number(
                    item.count
                  )
              ),

          borderColor:
            "#4f46e5",

          backgroundColor:
            "rgba(79, 70, 229, 0.10)",

          fill: true,

          tension: 0.35,

          pointRadius: 4,

          pointHoverRadius: 6,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio:
        false,

      interaction: {
        intersect: false,

        mode: "index",
      },

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero:
            true,

          ticks: {
            precision: 0,
          },

          grid: {
            color:
              "rgba(148, 163, 184, 0.14)",
          },
        },

        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  }
);


// ========================
// AUDIT EVENTS BY ACTION
// ========================

const actionCanvas =
  document.getElementById(
    "auditActionChart"
  );

new Chart(
  actionCanvas,
  {
    type: "bar",

    data: {
      labels:
        dashboardData
          .auditByAction
          .map(
            (item) =>
              item.action
          ),

      datasets: [
        {
          label: "Events",

          data:
            dashboardData
              .auditByAction
              .map(
                (item) =>
                  Number(
                    item.count
                  )
              ),

          backgroundColor:
            "#0ea5e9",

          borderRadius: 8,

          maxBarThickness: 58,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio:
        false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero:
            true,

          ticks: {
            precision: 0,
          },

          grid: {
            color:
              "rgba(148, 163, 184, 0.14)",
          },
        },

        x: {
          ticks: {
            maxRotation: 35,

            minRotation: 0,
          },

          grid: {
            display: false,
          },
        },
      },
    },
  }
);
