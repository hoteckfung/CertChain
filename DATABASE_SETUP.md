# Database Setup Guide

This guide walks you through setting up the MySQL database for your CertChain application with user authentication and role-based authorization.

## 📁 File Organization

Your database setup is now properly organized:

```
📦 CertChain Project
├── 📄 certchain.session.sql         # Database schema
├── 📄 DATABASE_SETUP.md             # This guide
├── 🔧 scripts/
│   └── setup-database.js            # Automated setup script
├── 🔧 utils/
│   └── mysql.js                     # Database utilities (server-side)
├── 🔧 lib/
│   ├── auth-client.js               # Client-side auth utilities
│   └── auth-server.js               # Server-side auth utilities
├── 🌐 pages/api/
│   ├── db-test.js                   # Database testing endpoint
│   └── admin/
│       └── users.js                 # User management (admin only)
└── 📄 package.json                  # Updated with db: scripts
```

## Prerequisites

1. **MySQL Server** - Ensure MySQL is installed and running on your machine
2. **Node.js** - Required for running the setup scripts
3. **Environment Variables** - Properly configured `.env.local` file

## Quick Setup

### 1. Verify Environment Configuration

Your `.env.local` file should contain:

```bash
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=certchain

# JWT Secret for token generation (optional)
JWT_SECRET=your_secret_key_here
```

### 2. Run Database Setup

Execute the setup script to create the database and tables:

```bash
npm run db:setup
```

This script will:

- Connect to your MySQL server
- Create the `certchain` database if it doesn't exist
- Set up all required tables (users, certificates, activity_logs)
- Insert a default admin user
- Verify the setup

### 3. Test Database Connection

Start your development server and test the database:

```bash
npm run dev
```

Then test using the npm script:

```bash
npm run db:test
```

Or visit: `http://localhost:3000/api/db-test`

This endpoint will show:

- Database connection status
- User count statistics
- Database configuration details

## 🏗️ Architecture Overview

### Client-Side (`lib/auth-client.js`)

Handles browser-specific authentication:

- Wallet connection (MetaMask)
- LocalStorage management
- Role-based routing
- Client-side auth checks

### Server-Side (`lib/auth-server.js`)

Handles API route authentication:

- Database user validation
- Role verification
- Session management
- Activity logging

### Database Layer (`utils/mysql.js`)

Provides database operations:

- Connection pooling
- User CRUD operations
- Activity logging
- Error handling

## Database Schema

### Users Table

Stores user accounts with wallet-based authentication:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    role ENUM('admin', 'issuer', 'holder') NOT NULL,
    username VARCHAR(255),
    email VARCHAR(255),
    profile_image VARCHAR(255),
    created_at DATETIME NOT NULL,
    last_active DATETIME NOT NULL
);
```

### Activity Logs Table

Tracks user actions and system events:

```sql
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    wallet_address VARCHAR(42),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Certificates Table

Manages blockchain certificates:

```sql
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ipfs_hash VARCHAR(255) NOT NULL UNIQUE,
    token_id VARCHAR(255) UNIQUE,
    issuer_id INT NOT NULL,
    holder_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_date DATETIME NOT NULL,
    status ENUM('pending', 'issued', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    metadata JSON,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

## User Roles & Permissions

### Admin Role

- Full system access
- User management (view/edit all users)
- Role assignment capabilities
- System administration

### Issuer Role

- Certificate creation and management
- View issued certificates
- Certificate approval/rejection

### Holder Role (Default)

- View owned certificates
- Certificate verification
- Profile management

## API Endpoints

### Database Testing

- `GET /api/db-test` - Test database connectivity and stats

### Admin Management

- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users` - Update user roles (admin only)

## Authentication Flow

1. **User connects wallet** on the login page via your existing AuthContext
2. **System checks** if wallet address exists in database
3. **New users** are automatically created with 'holder' role
4. **Existing users** have their last_active timestamp updated
5. **Authentication state** is managed by your AuthContext
6. **Middleware redirects** users based on their role

## Middleware Protection

The `middleware.js` file handles:

- Route protection (authenticated vs public routes)
- Role-based access control
- Automatic redirects based on user permissions

### Protected Routes

- `/admin/*` - Admin only
- `/issuer/*` - Issuer and Admin only
- `/holder/*` - All authenticated users

### Public Routes

- `/` - Home page
- `/login` - Authentication page
- `/verify` - Certificate verification

## 🧹 What Was Cleaned Up

### Removed Duplicates:

- ❌ `utils/db.js` (duplicate of mysql.js)
- ❌ `utils/auth.js` (mixed client/server logic)
- ❌ `utils/database-schema.sql` (duplicate schema)
- ❌ `pages/api/auth/login.js` (conflicted with AuthContext)
- ❌ `pages/api/auth/logout.js` (conflicted with AuthContext)
- ❌ `pages/api/auth/me.js` (conflicted with AuthContext)

### Organized Structure:

- ✅ **Client-side auth**: `lib/auth-client.js`
- ✅ **Server-side auth**: `lib/auth-server.js`
- ✅ **Database utilities**: `utils/mysql.js`
- ✅ **Consistent naming**: `npm run db:setup`, `npm run db:test`

## NPM Scripts

```bash
npm run dev          # Start development server
npm run db:setup     # Initialize database
npm run db:test      # Test database connection
```

## Troubleshooting

### Database Connection Issues

1. **Check MySQL Service**:

   ```bash
   # Windows
   net start mysql

   # macOS/Linux
   sudo service mysql start
   ```

2. **Verify Credentials**:

   - Ensure your MySQL user/password in `.env.local` are correct
   - Test connection manually: `mysql -u root -p`

3. **Database Permissions**:
   ```sql
   GRANT ALL PRIVILEGES ON certchain.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Common Errors

**"Database connection failed"**

- Check if MySQL server is running
- Verify environment variables
- Ensure user has proper permissions

**"Table doesn't exist"**

- Run the setup script: `npm run db:setup`
- Check if schema file exists: `certchain.session.sql`

**"Authentication failed"**

- Your existing AuthContext handles this
- Check wallet connection in browser
- Verify user exists in database

## Manual Database Management

### Connect to MySQL

```bash
mysql -u root -p
USE certchain;
```

### Common Queries

```sql
-- View all users
SELECT * FROM users;

-- Check user roles
SELECT wallet_address, role, username FROM users;

-- View recent activity
SELECT u.username, al.action, al.created_at
FROM activity_logs al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 10;

-- Promote user to admin
UPDATE users SET role = 'admin' WHERE wallet_address = '0x...';
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Database Access**: Use limited privilege MySQL users in production
3. **Separation of Concerns**: Client and server auth logic properly separated
4. **Input Validation**: All user inputs are sanitized and validated
5. **SQL Injection**: Prepared statements protect against SQL injection

## Production Deployment

For production environments:

1. **Use environment-specific database**
2. **Enable SSL connections**
3. **Implement connection pooling** (already done in mysql.js)
4. **Add monitoring and logging**
5. **Regular database backups**
6. **Use proper role-based access control**

## Need Help?

If you encounter issues:

1. Check the console logs in your browser's developer tools
2. Review server logs: `npm run dev` output
3. Test database connectivity: `npm run db:test`
4. Verify your `.env.local` configuration
5. Check that your existing AuthContext is working properly
