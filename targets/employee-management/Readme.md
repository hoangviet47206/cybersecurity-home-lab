# 👥 Employee Management System

A full-stack Employee Management System built with **Node.js, Express.js, EJS, and MySQL**, with a strong focus on **authentication, role-based authorization, audit logging, and security monitoring**.

<p align="center">
  <strong>Employee Management • RBAC • Admin Dashboard • Audit Logging • Security</strong>
</p>

---

## 🌐 Live Demo

🔗 **Live Application:**  
https://employee-management-od9a.onrender.com

The application is deployed on **Render** and connected to a managed **MySQL database hosted on Aiven**.

---

## 📌 Overview

The **Employee Management System** is a web application designed to manage employee records, application users, permissions, and administrative activity through a centralized interface.

The system supports three roles:

- 👤 **Employee**
- 🧑‍💼 **Manager**
- 🛡️ **Admin**

Each role has different permissions based on **Role-Based Access Control (RBAC)**.

In addition to standard employee CRUD operations, the project includes:

- 🔐 Authentication and persistent sessions
- 👥 Employee management
- 🛡️ Role-based authorization
- 📊 Administrative dashboard
- ⚙️ User and role management
- 📝 Security audit logging
- 🚦 Authentication rate limiting
- 🪖 HTTP security headers
- 🧱 Content Security Policy
- ☁️ Production deployment

---

## 📚 Documentation

Detailed technical documentation is available in both **English** and **Vietnamese**.

The documentation provides a deeper explanation of:

- 🏗️ System architecture
- 🗄️ Database design
- 🔐 Authentication and session management
- 🛡️ Role-Based Access Control
- 👥 Employee management workflow
- 📊 Admin Dashboard
- ⚙️ User and role management
- 📝 Security audit logging
- 🔒 Security controls
- ☁️ Production deployment
- 🧪 Testing and verification
- 🧩 Development challenges and solutions
- 🔮 Future improvements

### 📄 Technical Documentation

| Language | Document |
|---|---|
| 🇬🇧 English | [Open English Documentation](docs/Document_EN.pdf) |
| 🇻🇳 Vietnamese | [Open Vietnamese Documentation](docs/Document_VI.pdf) |

> The PDF documents include detailed explanations, screenshots, tables, implementation decisions, testing results, and security-related design notes.

---

# ✨ Features

## 🔐 Authentication

The application provides a complete authentication flow for registered users.

Main authentication features include:

- User registration
- User login
- User logout
- Password hashing using **bcrypt**
- Persistent sessions stored in MySQL
- Secure session cookies
- Login rate limiting
- Registration rate limiting
- Authentication activity recorded in Audit Logs

---

## 👥 Employee Management

Authenticated users can view employee information and use filtering tools to search through employee records.

Managers and administrators receive additional management capabilities.

### Available Functions

- 🔎 Search and filter employees
- 📄 Pagination
- ➕ Add employees
- ✏️ Update employee information
- 🗑️ Delete employees
- ⚠️ Delete confirmation dialog
- 📝 Audit employee modifications

---

## 📊 Admin Dashboard

Administrators have access to a centralized dashboard that displays live statistics retrieved from the MySQL database.

### Summary Metrics

- 👥 Total Employees
- 👤 Total Users
- 🧑‍💼 Total Managers
- 🛡️ Total Administrators
- ❌ Failed Login Attempts
- 📝 Security Events Today

### Dashboard Charts

- 🍩 Users by Role
- 🏢 Employees by Office
- 📈 Audit Activity — Last 7 Days
- 📊 Audit Events by Action

The dashboard also displays recent security events.

Charts are rendered using **Chart.js**.

---

## ⚙️ User Management

Administrators can manage registered application accounts.

Available functions include:

- 👤 View registered users
- 🔗 View linked employee IDs
- 🏷️ View current roles
- 🔄 Change user roles
- 🛡️ Protect the current administrator from accidental self-demotion

Role modifications are automatically recorded in the audit log.

---

## 📝 Audit Logging

The application records important authentication, employee-management, and administrative events.

### Recorded Events

```text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT

EMPLOYEE_CREATED
EMPLOYEE_UPDATED
EMPLOYEE_DELETED

USER_ROLE_UPDATED
```

Each audit event may contain:

- User ID
- Username
- Action
- Target
- IP address
- Timestamp

Administrators can review these events through the dedicated **Audit Logs** interface.

---

# 🛡️ Role-Based Access Control

The application uses **Role-Based Access Control (RBAC)** to restrict features based on the authenticated user's role.

| Feature | 👤 Employee | 🧑‍💼 Manager | 🛡️ Admin |
|---|:---:|:---:|:---:|
| View Employees | ✅ | ✅ | ✅ |
| Search / Filter Employees | ✅ | ✅ | ✅ |
| Add Employee | ❌ | ✅ | ✅ |
| Edit Employee | ❌ | ✅ | ✅ |
| Delete Employee | ❌ | ❌ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ✅ |

Authorization is enforced on the **server side**, not only by hiding interface elements.

---

# 🧰 Technology Stack

## Backend

- 🟢 Node.js
- ⚡ Express.js

## Frontend

- 🖥️ EJS
- 🌐 HTML5
- 🎨 CSS3
- 🟨 JavaScript
- 📊 Chart.js

## Database

- 🐬 MySQL

## Authentication & Session Management

- 🔐 bcrypt
- 🍪 express-session
- 💾 express-mysql-session

## Security

- 🪖 Helmet
- 🧱 Content Security Policy
- 🚦 express-rate-limit
- 🛡️ Role-Based Access Control
- 📝 Audit Logging

## Deployment

- ☁️ Render
- 🗄️ Aiven MySQL

---

# 🏗️ System Architecture

The application follows an MVC-style separation of responsibilities.

```text
                    Browser
                       │
                       ▼
                Express Routes
                       │
                       ▼
                  Middleware
             Auth / RBAC / Rate Limit
                       │
                       ▼
                  Controllers
                  /         \
                 ▼           ▼
            EJS Views     Models
                              │
                              ▼
                         MySQL Database
```

Typical application request flow:

```text
Browser Request
      │
      ▼
Express Route
      │
      ▼
Authentication / RBAC Middleware
      │
      ▼
Controller
      │
      ▼
Model / Database Query
      │
      ▼
MySQL
      │
      ▼
EJS Response / Redirect
```

More detailed architecture information is available in the project documentation.

---

# 📁 Project Structure

Only the main directories are shown here.

```text
employee-management/
│
├── controllers/     # Application logic
├── middleware/      # Authentication, RBAC and rate limiting
├── models/          # Database connection and MySQL queries
├── routes/          # Express routes
├── views/           # EJS templates
├── public/          # CSS and client-side JavaScript
│
├── docs/
│   ├── Document_EN.pdf
│   └── Document_VI.pdf
│
├── app.js           # Application entry point
├── package.json
└── README.md
```

> Detailed descriptions of controllers, routes, database entities, workflows, and implementation decisions are provided in the technical documentation.

---

# 🔒 Security Features

## 🔑 Password Hashing

Passwords are never stored in plain text.

The application uses **bcrypt** to hash passwords before they are stored in MySQL.

During authentication, the submitted password is compared with the stored hash.

---

## 🛡️ Server-Side Authorization

Protected routes verify both:

1. Whether the user is authenticated.
2. Whether the user has the required role.

Example:

```text
Employee
   └── Read

Manager
   ├── Read
   ├── Create
   └── Update

Admin
   ├── Read
   ├── Create
   ├── Update
   ├── Delete
   ├── Dashboard
   ├── User Management
   └── Audit Logs
```

---

## 💾 Persistent Sessions

The application uses:

```text
express-session
        +
express-mysql-session
```

Session data is stored in MySQL instead of application memory.

This improves persistence across normal server restarts and makes session management more suitable for production deployment.

---

## 🍪 Secure Session Cookies

Session cookies use security-related options including:

- `httpOnly`
- `sameSite`
- `secure` in production
- Session expiration

---

## 🪖 Helmet

**Helmet** is used to configure security-related HTTP headers.

The application also implements a **Content Security Policy (CSP)**.

The policy restricts allowed sources for resources such as:

- JavaScript
- CSS
- Fonts
- Images
- Network connections

Dashboard JavaScript is stored in a separate static file so that the script policy does not require `unsafe-inline`.

---

## 🚦 Rate Limiting

Authentication endpoints use **express-rate-limit** to reduce automated abuse.

Rate limiting is currently applied to:

- Login
- Registration

This helps reduce repeated authentication attempts and basic brute-force behavior.

---

## 📝 Security Monitoring

Important application activity is stored in the `audit_logs` table.

Examples include:

```text
Successful login
Failed login
Logout
Employee creation
Employee modification
Employee deletion
User role modification
```

Administrators can review security activity from both:

- Admin Dashboard
- Audit Logs

---

# 📸 Screenshots

## 📊 Admin Dashboard

The Admin Dashboard displays employee, user, role, and security statistics using real database data.

---

## 👥 Employee Management

The Employees page provides filtering, pagination, employee CRUD operations, and role-specific controls.

---

## ⚙️ User Management

Administrators can review application users and manage their roles.

---

## 📝 Audit Logs

The Audit Logs page provides visibility into authentication events and administrative activity.

> Additional screenshots are available in the English and Vietnamese PDF documentation.

---

# 🚀 Installation

## 1. Clone the Repository

```bash
git clone <your-repository-url>
```

## 2. Open the Project

```bash
cd employee-management
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Configure Environment Variables

Create a `.env` file in the root directory.

Example:

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

SESSION_SECRET=

NODE_ENV=development
PORT=8000
```

> ⚠️ Never commit your real `.env` file, database credentials, passwords, or session secrets to GitHub.

Make sure `.env` is included in `.gitignore`.

## 5. Start the Application

```bash
npm start
```

The default local address can be:

```text
http://localhost:8000
```

---

# ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL database host |
| `DB_PORT` | MySQL database port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `SESSION_SECRET` | Secret used for application sessions |
| `NODE_ENV` | Application environment |
| `PORT` | Application server port |

---

# 🗺️ Main Routes

| Route | Description | Access |
|---|---|---|
| `/` | Home Page | Public |
| `/login` | Login | Public |
| `/register` | Registration | Public |
| `/employees` | Employee Management | Authenticated |
| `/admin/dashboard` | Admin Dashboard | Admin |
| `/admin/users` | User Management | Admin |
| `/audit-logs` | Security Audit Logs | Admin |

---

# ☁️ Deployment

The production application uses the following architecture:

```text
User Browser
      │
      ▼
    Render
Node.js + Express
      │
      ▼
 Aiven MySQL
```

### Live Application

🔗 https://employee-management-od9a.onrender.com

The Node.js application is hosted on **Render**, while the production MySQL database is hosted on **Aiven**.

Sensitive configuration values are supplied through environment variables rather than being hard-coded in the repository.

---

# 🧪 Testing

The application has been manually verified for important functional and security-related workflows, including:

- Valid authentication
- Invalid authentication
- Employee access
- Manager create/update permissions
- Admin-only employee deletion
- Admin Dashboard access
- User role modification
- Audit event generation
- Logout
- Role-based route protection
- Rate limiting
- Persistent sessions

Detailed testing results are available in the technical documentation:

- 🇬🇧 [English Documentation](docs/Document_EN.pdf)
- 🇻🇳 [Vietnamese Documentation](docs/Document_VI.pdf)

---

# 🧩 Development Challenges

Several practical issues were addressed during development, including:

- Persistent authentication after deployment
- Role-specific permissions
- Security audit logging
- Dashboard aggregation from real MySQL data
- Converting office codes into readable office names
- Content Security Policy conflicts with inline JavaScript
- Consistent navigation across administrative pages
- Maintaining stable CRUD behavior while improving security controls

Detailed explanations of these challenges and their solutions are included in the PDF documentation.

---

# 🔮 Future Improvements

Potential future improvements include:

- 🛡️ Complete CSRF protection
- 🔑 Password reset workflow
- ✉️ Email verification
- 🔍 Advanced Audit Log filtering
- 📅 Audit Log date filtering
- 📤 Audit Log export
- 👤 Detailed employee profile pages
- 📊 Additional dashboard analytics
- 🧪 Automated unit tests
- 🧪 Integration tests
- 🐳 Docker Compose configuration
- ⚙️ CI/CD pipeline
- 🔒 Account lockout policy
- 🔐 Password policy enforcement

---

# 🎓 What I Learned

This project provided practical experience with:

- Full-stack web development using Node.js
- Express routing and middleware
- MySQL database integration
- Authentication and session management
- Password hashing
- Role-Based Access Control
- CRUD operations
- Security audit logging
- HTTP security headers
- Rate limiting
- Content Security Policy
- Dashboard data visualization
- Production deployment
- Application structure and maintainability
- Security-focused web application design

---

# 👨‍💻 Author

**Nguyen Hoang Viet**

Cybersecurity / Network Security Student

GitHub: **[@hoangviet47206](https://github.com/hoangviet47206)**

---

# 📄 Documentation

For full technical details, implementation notes, screenshots, testing results, and security analysis:

| Language | PDF |
|---|---|
| 🇬🇧 English | [Document_EN.pdf](docs/Document_EN.pdf) |
| 🇻🇳 Vietnamese | [Document_VI.pdf](docs/Document_VI.pdf) |

---

⭐ If you find this project useful, feel free to explore the repository, review the documentation, and try the live demo.