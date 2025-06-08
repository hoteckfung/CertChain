# CertChain Authentication Troubleshooting Guide

## 🔍 MySQL Connection: ✅ CONFIRMED WORKING

Our tests confirm that MySQL is connected and working properly:

- ✅ Database: `certchain` on `localhost:3333`
- ✅ Tables: `users`, `activity_logs`, `certificates`, `user_sessions`
- ✅ Data: 4 users (1 admin, 1 issuer, 2 holders)

## 🧪 Test Users Available for Login

| Role   | Username     | Wallet Address                             | Status    |
| ------ | ------------ | ------------------------------------------ | --------- |
| admin  | System Admin | 0x241dBc6d5f283964536A94e33E2323B7580CE45A | ✅ Active |
| issuer | Test Issuer  | 0x6ae5FfE48c1395260cF096134E5e32725c24080a | ✅ Active |
| holder | Test Holder  | 0x01178ee99F7E50957Ab591b0C7ca307E593254C9 | ✅ Active |

## 🔧 Step-by-Step Debugging

### 1. Check Next.js Server Status

```bash
# Make sure the development server is running
npm run dev

# Should see: "ready - started server on 0.0.0.0:3000"
```

### 2. Test Database Connection

```bash
# Run our database test script
node scripts/test-db-connection.js

# Should show: "🎉 Database connection test completed successfully!"
```

### 3. Test Authentication APIs

```bash
# Test database status API
curl http://localhost:3000/api/db-test

# Test login with admin user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x241dBc6d5f283964536A94e33E2323B7580CE45A"}'

# Test role verification
curl http://localhost:3000/api/auth/verify-role
```

### 4. Check Browser Console

1. Open browser to `http://localhost:3000/login`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for any JavaScript errors

### 5. Check MetaMask Connection

1. Make sure MetaMask is installed and unlocked
2. Ensure you're on the correct network
3. Check if wallet connection is working

## 🎯 Most Likely Issues & Solutions

### Issue 1: "Cannot connect to database"

**Symptoms:** Login page shows database error
**Solution:**

- Check if MySQL is running: `mysql -u root -p`
- Verify `.env.local` file has correct credentials
- Run: `node scripts/test-db-connection.js`

### Issue 2: "MetaMask not found"

**Symptoms:** Login button disabled, MetaMask warning
**Solution:**

- Install MetaMask browser extension
- Unlock MetaMask wallet
- Refresh the page

### Issue 3: "Failed to connect wallet"

**Symptoms:** Button clicks but login fails
**Solution:**

- Check browser console for errors
- Ensure MetaMask is on correct network
- Try disconnecting and reconnecting MetaMask

### Issue 4: "Authentication failed"

**Symptoms:** Login succeeds but redirects back to login
**Solution:**

- Check cookies are enabled in browser
- Clear browser cache and cookies
- Check if wallet address exists in database

### Issue 5: "Access denied to role pages"

**Symptoms:** User logs in but can't access dashboard
**Solution:**

- Verify user role in database: `SELECT * FROM users WHERE wallet_address = 'YOUR_WALLET'`
- Check middleware.js for route permissions
- Ensure user is active: `is_active = 1`

## 🔧 Quick Fixes

### Fix 1: Reset Authentication State

```javascript
// In browser console, clear authentication
localStorage.clear();
sessionStorage.clear();
document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
location.reload();
```

### Fix 2: Create New Test User

```sql
-- If existing users don't work, create a new one
INSERT INTO users (wallet_address, role, username, email, is_active, created_at, last_active)
VALUES ('YOUR_WALLET_ADDRESS', 'admin', 'Test User', 'test@example.com', 1, NOW(), NOW());
```

### Fix 3: Check User Status

```sql
-- Verify user exists and is active
SELECT id, username, role, wallet_address, is_active, last_active
FROM users
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Activate user if needed
UPDATE users SET is_active = 1 WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

## 📋 Testing Checklist

- [ ] MySQL server is running
- [ ] Next.js development server is running (`npm run dev`)
- [ ] Database test passes (`node scripts/test-db-connection.js`)
- [ ] MetaMask is installed and unlocked
- [ ] Browser console shows no errors
- [ ] API endpoints respond correctly
- [ ] User exists in database and is active
- [ ] Cookies are enabled in browser

## 🆘 Still Having Issues?

If authentication still isn't working after trying these steps:

1. **Check the logs:** Look at the terminal where `npm run dev` is running for error messages
2. **Try a different browser:** Sometimes browser extensions interfere
3. **Clear everything:** Clear browser data, restart MetaMask, restart dev server
4. **Test with curl:** Use the curl commands above to test APIs directly

## 📞 Debug Commands

```bash
# View recent activity logs
node -e "
const mysql = require('./utils/mysql');
mysql.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10')
  .then(({data}) => console.table(data));
"

# Check current users
node -e "
const mysql = require('./utils/mysql');
mysql.query('SELECT id, username, role, wallet_address, is_active FROM users')
  .then(({data}) => console.table(data));
"
```

## ✅ Expected Working Flow

1. Visit `http://localhost:3000/login`
2. Click "Connect with MetaMask"
3. MetaMask popup appears → Click Connect
4. Page redirects based on role:
   - Admin → `/admin`
   - Issuer → `/issuer`
   - Holder → `/holder`

If this flow isn't working, use this guide to identify and fix the issue!
