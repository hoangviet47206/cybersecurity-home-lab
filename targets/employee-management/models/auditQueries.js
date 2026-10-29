const pool =
  require("./pool");


// ========================
// CREATE AUDIT LOG
// ========================

async function createAuditLog({
  userId = null,
  username = null,
  action,
  target = null,
  ipAddress = null,
}) {

  const [result] =
    await pool.execute(
      `
        INSERT INTO audit_logs (
          user_id,
          username,
          action,
          target,
          ip_address
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        userId,
        username,
        action,
        target,
        ipAddress,
      ]
    );


  return result;
}


// ========================
// GET AUDIT LOGS
// ========================

async function getAuditLogs(
  limit = 100
) {

  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 100,
        500
      )
    );


  const [rows] =
    await pool.query(
      `
        SELECT
          id,
          user_id,
          username,
          action,
          target,
          ip_address,
          created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `
    );


  return rows;
}


// ========================
// DASHBOARD:
// FAILED LOGIN COUNT
// ========================

async function getFailedLoginCount() {

  const [rows] =
    await pool.execute(
      `
        SELECT
          COUNT(*) AS count
        FROM audit_logs
        WHERE action = ?
      `,
      [
        "LOGIN_FAILED",
      ]
    );


  return rows[0].count;
}


// ========================
// DASHBOARD:
// AUDIT LOGS BY ACTION
// ========================

async function getAuditLogsByAction() {

  const [rows] =
    await pool.execute(
      `
        SELECT
          action,
          COUNT(*) AS count
        FROM audit_logs
        GROUP BY action
        ORDER BY count DESC
      `
    );


  return rows;
}


// ========================
// DASHBOARD:
// LAST 7 DAYS ACTIVITY
// ========================

async function getAuditActivityLast7Days() {

  const [rows] =
    await pool.execute(
      `
        SELECT
          DATE(created_at) AS event_date,
          COUNT(*) AS count
        FROM audit_logs
        WHERE created_at >=
          DATE_SUB(
            CURDATE(),
            INTERVAL 6 DAY
          )
        GROUP BY
          DATE(created_at)
        ORDER BY
          event_date ASC
      `
    );


  return rows;
}


// ========================
// DASHBOARD:
// RECENT SECURITY EVENTS
// ========================

async function getRecentAuditLogs(
  limit = 5
) {

  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 5,
        20
      )
    );


  const [rows] =
    await pool.query(
      `
        SELECT
          id,
          user_id,
          username,
          action,
          target,
          ip_address,
          created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `
    );


  return rows;
}


// ========================
// DASHBOARD:
// TODAY AUDIT COUNT
// ========================

async function getTodayAuditCount() {

  const [rows] =
    await pool.execute(
      `
        SELECT
          COUNT(*) AS count
        FROM audit_logs
        WHERE DATE(created_at) =
          CURDATE()
      `
    );


  return rows[0].count;
}


// ========================
// EXPORTS
// ========================

module.exports = {
  createAuditLog,
  getAuditLogs,

  getFailedLoginCount,
  getAuditLogsByAction,
  getAuditActivityLast7Days,
  getRecentAuditLogs,
  getTodayAuditCount,
};