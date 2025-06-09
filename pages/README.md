# Pages Directory Structure

This directory contains all the pages and API routes for the CertChain blockchain certificate management system.

## 🏠 Main Pages

### Public Pages

- `index.js` - **Landing page** with role-based navigation (Admin/Issuer/Holder access)
- `login.js` - **Authentication page** for MetaMask wallet connection
- `verify.js` - **Public verification page** for certificate validation (no auth required)

### Role-Based Dashboard Pages

- `admin.js` - **Admin Dashboard** with user management, activity monitoring, and system overview
- `issuer.js` - **Issuer Dashboard** for creating and issuing blockchain certificates
- `holder.js` - **Holder Dashboard** for viewing owned certificates and downloads

### Admin Specific Pages

- `admin/database.js` - **Database management** page for checking connection status

### Development/Testing Pages

- `test-shadcn.js` - **Component testing** page for UI components
- `_app.js` - **App wrapper** with global context providers and auth handling
- `_document.js` - **Document wrapper** for custom HTML structure

## 🔌 API Routes

### Authentication APIs (`/api/auth/`)

- `login.js` - Handle wallet-based authentication and user creation
- `logout.js` - Handle session cleanup and logout
- `verify-role.js` - Verify user roles and authentication status
- `get-profile.js` - Retrieve user profile data from database
- `update-last-login.js` - Update user's last login timestamp

### Admin APIs (`/api/admin/`)

- `users.js` - User management (CRUD operations, role changes)

### Blockchain APIs (`/api/blockchain/`)

- `issue-certificate.js` - Issue certificates on blockchain via smart contract
- `verify-certificate.js` - Verify certificates using IPFS hash or token ID

### Activity Logging APIs (`/api/activity/`)

- `log.js` - Log user activities and system events
- `get-logs.js` - Retrieve activity logs with filtering and pagination

### Profile APIs (`/api/profile/`)

- `[walletAddress].js` - Dynamic profile management by wallet address

### Utility APIs

- `db-test.js` - Database connection testing
- `debug-env.js` - Environment variable debugging (dev only)

## 🔒 Authentication Flow

1. **Public Access**: `index.js`, `verify.js`, `login.js`
2. **Wallet Connection**: Users connect MetaMask wallet on `login.js`
3. **Role-Based Routing**:
   - Admins → `admin.js`
   - Issuers → `issuer.js`
   - Holders → `holder.js`
4. **Protected Routes**: All dashboard pages use `ProtectedRoute` component

## 🎯 Key Features by Page

### Admin Dashboard (`admin.js`)

- User role management
- System activity monitoring
- Database status overview
- User statistics and analytics

### Issuer Dashboard (`issuer.js`)

- Certificate creation with templates
- IPFS file upload
- Blockchain certificate issuance
- Bulk certificate generation from Excel
- Issued certificates management

### Holder Dashboard (`holder.js`)

- View owned certificates
- Download certificates in multiple formats
- Share certificate links
- Certificate verification

### Verification Page (`verify.js`)

- QR code scanning
- IPFS hash verification
- Token ID verification
- Public certificate validation

## 🔧 Development Notes

- All pages use **blockchain-first authentication** (MetaMask wallet)
- **No email/username auth** - wallet address is the primary identifier
- Pages are responsive and use **Tailwind CSS**
- **Protected routes** check roles via blockchain smart contract
- **IPFS integration** for decentralized certificate storage

## 📁 Folder Structure Summary

```
pages/
├── admin/                 # Admin-specific pages
│   └── database.js       # Database management
├── api/                  # Backend API routes
│   ├── activity/         # Activity logging APIs
│   ├── admin/           # Admin management APIs
│   ├── auth/            # Authentication APIs
│   ├── blockchain/      # Blockchain interaction APIs
│   └── profile/         # User profile APIs
├── admin.js             # Admin dashboard
├── holder.js            # Certificate holder dashboard
├── index.js             # Landing page
├── issuer.js            # Certificate issuer dashboard
├── login.js             # Wallet authentication
├── verify.js            # Public certificate verification
├── _app.js              # App initialization
└── _document.js         # HTML document structure
```

## 🚀 Getting Started

1. Start from `index.js` (landing page)
2. Connect wallet via `login.js`
3. Get redirected to appropriate dashboard based on blockchain role
4. Use verification page for public certificate validation

## 🔍 API Endpoint Summary

| Endpoint                             | Method         | Purpose                | Auth Required |
| ------------------------------------ | -------------- | ---------------------- | ------------- |
| `/api/auth/login`                    | POST           | Wallet authentication  | No            |
| `/api/auth/logout`                   | POST           | Session cleanup        | Yes           |
| `/api/auth/verify-role`              | GET            | Role verification      | Yes           |
| `/api/auth/get-profile`              | POST           | Get user profile       | Yes           |
| `/api/auth/update-last-login`        | POST           | Update login timestamp | Yes           |
| `/api/admin/users`                   | GET/PUT/DELETE | User management        | Admin         |
| `/api/activity/log`                  | POST           | Log activities         | No            |
| `/api/activity/get-logs`             | GET            | Get activity logs      | No            |
| `/api/blockchain/issue-certificate`  | POST           | Issue certificate      | Yes           |
| `/api/blockchain/verify-certificate` | GET            | Verify certificate     | No            |
| `/api/profile/[wallet]`              | GET/PUT        | Profile management     | Yes           |
