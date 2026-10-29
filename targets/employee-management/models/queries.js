const pool = require("./pool");

const PAGE_SIZE = 10;


// ========================
// FILTER
// ========================

const buildFilterQuery = (
  filters = {}
) => {

  const conditions = [];
  const values = [];

  const filterFields = [
    "employeeNumber",
    "email",
    "extension",
    "lastName",
    "firstName",
    "jobTitle",
    "officeCode",
    "reportsTo",
  ];


  filterFields.forEach(
    (field) => {

      if (filters[field]) {

        conditions.push(
          `${field} LIKE ?`
        );

        values.push(
          `%${filters[field]}%`
        );
      }
    }
  );


  const whereClause =
    conditions.length > 0
      ? ` WHERE ${conditions.join(
          " AND "
        )}`
      : "";


  return {
    whereClause,
    values,
  };
};


// ========================
// COUNT EMPLOYEES
// ========================

const getEmployeeCount =
  async (
    filters = {}
  ) => {

    const {
      whereClause,
      values,
    } =
      buildFilterQuery(
        filters
      );


    const sql = `
      SELECT
        COUNT(*) AS count
      FROM employees
      ${whereClause}
    `;


    const [rows] =
      await pool.query(
        sql,
        values
      );


    return rows[0].count;
  };


// ========================
// GET EMPLOYEES
// ========================

const getEmployees =
  async (
    page = 1,
    filters = {}
  ) => {

    const {
      whereClause,
      values,
    } =
      buildFilterQuery(
        filters
      );


    const offset =
      (page - 1) *
      PAGE_SIZE;


    const sql = `
      SELECT *
      FROM employees
      ${whereClause}
      ORDER BY employeeNumber
      LIMIT ?
      OFFSET ?
    `;


    values.push(
      PAGE_SIZE
    );

    values.push(
      offset
    );


    const [rows] =
      await pool.query(
        sql,
        values
      );


    return rows;
  };


// ========================
// ADD EMPLOYEE
// ========================

const addNewEmployee =
  async ({
    employeeNumber,
    lastName,
    firstName,
    extension,
    email,
    officeCode,
    reportsTo,
    jobTitle,
  }) => {

    await pool.query(
      `
        INSERT INTO employees (
          employeeNumber,
          lastName,
          firstName,
          extension,
          email,
          officeCode,
          reportsTo,
          jobTitle
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        employeeNumber,
        lastName,
        firstName,
        extension,
        email,
        officeCode,
        reportsTo,
        jobTitle,
      ]
    );
  };


// ========================
// DELETE EMPLOYEE
// ========================

const deleteEmployee =
  async (
    employeeNumber
  ) => {

    const conn =
      await pool.getConnection();


    try {

      await conn.beginTransaction();


      // Customers đang tham chiếu employee này
      await conn.query(
        `
          UPDATE customers
          SET salesRepEmployeeNumber = NULL
          WHERE salesRepEmployeeNumber = ?
        `,
        [
          employeeNumber,
        ]
      );


      // Employee khác đang reportsTo employee này
      await conn.query(
        `
          UPDATE employees
          SET reportsTo = NULL
          WHERE reportsTo = ?
        `,
        [
          employeeNumber,
        ]
      );


      // Xóa employee
      await conn.query(
        `
          DELETE FROM employees
          WHERE employeeNumber = ?
        `,
        [
          employeeNumber,
        ]
      );


      await conn.commit();

    } catch (error) {

      await conn.rollback();

      throw error;

    } finally {

      conn.release();

    }
  };


// ========================
// UPDATE EMPLOYEE
// ========================

const updateEmployee =
  async (
    employeeData
  ) => {

    const {
      employeeNumber,
      lastName,
      firstName,
      extension,
      email,
      officeCode,
      reportsTo,
      jobTitle,
    } =
      employeeData;


    const fields = {
      lastName,
      firstName,
      extension,
      email,
      officeCode,
      reportsTo,
      jobTitle,
    };


    const setClauses = [];
    const values = [];


    Object.entries(
      fields
    ).forEach(
      ([key, value]) => {

        if (
          value !==
          undefined
        ) {

          setClauses.push(
            `${key} = ?`
          );

          values.push(
            value
          );
        }
      }
    );


    if (
      setClauses.length === 0
    ) {
      return;
    }


    const sql = `
      UPDATE employees
      SET ${setClauses.join(
        ", "
      )}
      WHERE employeeNumber = ?
    `;


    values.push(
      employeeNumber
    );


    await pool.query(
      sql,
      values
    );
  };


// ========================
// DASHBOARD:
// EMPLOYEES BY OFFICE
// ========================

const getEmployeesByOffice =
  async () => {

    const [rows] =
      await pool.query(
        `
          SELECT
            e.officeCode,

            o.city AS officeName,

            COUNT(
              e.employeeNumber
            ) AS count

          FROM employees AS e

          LEFT JOIN offices AS o
            ON e.officeCode =
               o.officeCode

          GROUP BY
            e.officeCode,
            o.city

          ORDER BY
            e.officeCode
        `
      );


    return rows;
  };


// ========================
// DASHBOARD:
// TOTAL OFFICES IN USE
// ========================

const getOfficeCount =
  async () => {

    const [rows] =
      await pool.query(
        `
          SELECT
            COUNT(
              DISTINCT officeCode
            ) AS count
          FROM employees
        `
      );


    return rows[0].count;
  };


// ========================
// EXPORTS
// ========================

module.exports = {
  PAGE_SIZE,

  getEmployeeCount,
  getEmployees,
  addNewEmployee,
  deleteEmployee,
  updateEmployee,

  getEmployeesByOffice,
  getOfficeCount,
};
