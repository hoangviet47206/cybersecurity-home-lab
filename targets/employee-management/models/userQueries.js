const pool =
  require("./pool");


// ========================
// FIND USER BY USERNAME
// ========================

async function findUserByUsername(
  username
) {

  const [rows] =
    await pool.execute(
      `
        SELECT *
        FROM users
        WHERE username = ?
      `,
      [
        username,
      ]
    );


  return rows[0];
}


// ========================
// FIND USER BY EMAIL
// ========================

async function findUserByEmail(
  email
) {

  const [rows] =
    await pool.execute(
      `
        SELECT *
        FROM users
        WHERE email = ?
      `,
      [
        email,
      ]
    );


  return rows[0];
}


// ========================
// CREATE USER
// ========================

async function createUser(
  username,
  email,
  passwordHash
) {

  const [result] =
    await pool.execute(
      `
        INSERT INTO users (
          username,
          email,
          password_hash
        )
        VALUES (?, ?, ?)
      `,
      [
        username,
        email,
        passwordHash,
      ]
    );


  return result;
}


// ========================
// GET ALL USERS
// ADMIN
// ========================

async function getAllUsers() {

  const [rows] =
    await pool.execute(
      `
        SELECT
          id,
          username,
          email,
          role,
          employee_id
        FROM users
        ORDER BY id ASC
      `
    );


  return rows;
}


// ========================
// FIND USER BY ID
// ========================

async function findUserById(
  userId
) {

  const [rows] =
    await pool.execute(
      `
        SELECT
          id,
          username,
          email,
          role,
          employee_id
        FROM users
        WHERE id = ?
      `,
      [
        userId,
      ]
    );


  return rows[0];
}


// ========================
// UPDATE USER ROLE
// ========================

async function updateUserRole(
  userId,
  role
) {

  const [result] =
    await pool.execute(
      `
        UPDATE users
        SET role = ?
        WHERE id = ?
      `,
      [
        role,
        userId,
      ]
    );


  return result;
}


// ========================
// DASHBOARD:
// TOTAL USERS
// ========================

async function getUserCount() {

  const [rows] =
    await pool.execute(
      `
        SELECT
          COUNT(*) AS count
        FROM users
      `
    );


  return rows[0].count;
}


// ========================
// DASHBOARD:
// USERS BY ROLE
// ========================

async function getUsersByRole() {

  const [rows] =
    await pool.execute(
      `
        SELECT
          role,
          COUNT(*) AS count
        FROM users
        GROUP BY role
        ORDER BY role
      `
    );


  return rows;
}


// ========================
// DASHBOARD:
// ROLE COUNT
// ========================

async function getRoleCount(
  role
) {

  const [rows] =
    await pool.execute(
      `
        SELECT
          COUNT(*) AS count
        FROM users
        WHERE role = ?
      `,
      [
        role,
      ]
    );


  return rows[0].count;
}


// ========================
// EXPORTS
// ========================

module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,

  getAllUsers,
  findUserById,
  updateUserRole,

  getUserCount,
  getUsersByRole,
  getRoleCount,
};