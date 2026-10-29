
const dotenv =
  require("dotenv");

const express =
  require("express");

const session =
  require("express-session");

const helmet =
  require("helmet");

const MySQLStoreFactory =
  require("express-mysql-session");

const path =
  require("node:path");


// ========================
// ROUTERS
// ========================

const employeeRouter =
  require("./routes/employeeRouter");

const authRouter =
  require("./routes/authRouter");

const auditRouter =
  require("./routes/auditRouter");

const userAdminRouter =
  require("./routes/userAdminRouter");

const adminDashboardRouter =
  require("./routes/adminDashboardRouter");


// ========================
// ENVIRONMENT
// ========================

dotenv.config();


// ========================
// APP
// ========================

const app =
  express();

const PORT =
  process.env.PORT ||
  8000;

const isProduction =
  process.env.NODE_ENV ===
  "production";


// ========================
// TRUST PROXY
// RENDER / PRODUCTION
// ========================

if (isProduction) {

  app.set(
    "trust proxy",
    1
  );

}


// ========================
// VIEW ENGINE
// ========================

app.set(
  "view engine",
  "ejs"
);

app.set(
  "views",
  path.join(
    __dirname,
    "views"
  )
);


// ========================
// HELMET
// ========================

app.use(
  helmet({
    contentSecurityPolicy: {

      directives: {

        // Mặc định chỉ cho phép
        // tài nguyên từ chính website.
        defaultSrc: [
          "'self'",
        ],


        // JavaScript:
        // - file JS trong /public
        // - Chart.js từ jsDelivr
        //
        // Không còn unsafe-inline.
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
        ],


        // CSS:
        // - CSS local
        // - Google Fonts
        //
        // Giữ unsafe-inline cho style
        // để tránh làm hỏng những view
        // hiện tại nếu còn inline style.
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],


        // Font từ Google Fonts.
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],


        // Ảnh local hoặc data URI.
        imgSrc: [
          "'self'",
          "data:",
        ],


        // AJAX / fetch chỉ được
        // gọi về chính website.
        connectSrc: [
          "'self'",
        ],


        // Không cho nhúng object,
        // Flash hoặc plugin.
        objectSrc: [
          "'none'",
        ],


        // Base URL chỉ từ website.
        baseUri: [
          "'self'",
        ],


        // Form chỉ submit về
        // chính ứng dụng.
        formAction: [
          "'self'",
        ],


        // Ngăn website khác
        // nhúng app bằng iframe.
        frameAncestors: [
          "'self'",
        ],


        // Production dùng HTTPS.
        // Localhost không ép upgrade.
        upgradeInsecureRequests:
          isProduction
            ? []
            : null,
      },
    },
  })
);


// ========================
// BODY PARSERS
// ========================

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  express.json()
);


// ========================
// STATIC FILES
// ========================

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);


// ========================
// MYSQL SESSION STORE
// ========================

const MySQLStore =
  MySQLStoreFactory(
    session
  );


const sessionStore =
  new MySQLStore({

    host:
      process.env.DB_HOST,

    port:
      Number(
        process.env.DB_PORT
      ) || 3306,

    user:
      process.env.DB_USER,

    password:
      process.env.DB_PASSWORD,

    database:
      process.env.DB_NAME,

    createDatabaseTable:
      true,


    schema: {

      tableName:
        "sessions",

      columnNames: {

        session_id:
          "session_id",

        expires:
          "expires",

        data:
          "data",
      },
    },
  });


// ========================
// SESSION
// ========================

app.use(
  session({

    name:
      "employee.sid",

    secret:
      process.env
        .SESSION_SECRET ||
      "dev-secret-key",

    store:
      sessionStore,

    resave:
      false,

    saveUninitialized:
      false,


    cookie: {

      httpOnly:
        true,

      sameSite:
        "lax",

      secure:
        isProduction,

      maxAge:
        1000 *
        60 *
        30,
    },
  })
);


// ========================
// GLOBAL CURRENT USER
// ========================

app.use(
  (
    req,
    res,
    next
  ) => {

    res.locals.currentUser =
      req.session.user ||
      null;

    next();
  }
);


// ========================
// ROUTES
// ========================

app.use(
  "/",
  authRouter
);


app.use(
  "/",
  employeeRouter
);


app.use(
  "/",
  adminDashboardRouter
);


app.use(
  "/",
  userAdminRouter
);


app.use(
  "/",
  auditRouter
);


// ========================
// 404
// ========================

app.use(
  (
    req,
    res
  ) => {

    return res
      .status(404)
      .render(
        "error-page",
        {

          statusCode:
            404,

          title:
            "Page Not Found",

          message:
            "The page you are looking for does not exist.",
        }
      );
  }
);


// ========================
// GLOBAL ERROR HANDLER
// ========================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "Application error:",
      error
    );


    const statusCode =
      error.status ||
      error.statusCode ||
      500;


    let title =
      "Internal Server Error";

    let message =
      "Something went wrong. Please try again.";


    // ========================
    // 403
    // ========================

    if (
      statusCode ===
      403
    ) {

      title =
        "Access Denied";

      message =
        "You do not have permission to access this page.";

    }


    // ========================
    // 404
    // ========================

    else if (
      statusCode ===
      404
    ) {

      title =
        "Page Not Found";

      message =
        "The requested page could not be found.";

    }


    // ========================
    // 429
    // ========================

    else if (
      statusCode ===
      429
    ) {

      title =
        "Too Many Requests";

      message =
        "Too many requests. Please try again later.";

    }


    return res
      .status(
        statusCode
      )
      .render(
        "error-page",
        {

          statusCode,
          title,
          message,
        }
      );
  }
);


// ========================
// START SERVER
// ========================

app.listen(
  PORT,
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );

  }
);
