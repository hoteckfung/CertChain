# Browser Authentication Debug Guide

## 🎯 **The Problem is Client-Side**

Our tests confirm:
- ✅ **Server**: MySQL, APIs, authentication all working perfectly
- ✅ **Database**: Users exist with correct roles and wallet addresses
- ✅ **Login API**: Successfully authenticates and sets cookies
- ✅ **Role Pages**: Return 200 OK when accessed with auth cookies

**The issue is in the browser** - likely MetaMask connection or cookie handling.

## 🔍 **Step-by-Step Browser Debugging**

### **Step 1: Open Browser Dev Tools**
1. Go to `http://localhost:3000/login` (or 3001)
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for any **red error messages**

### **Step 2: Check for JavaScript Errors**
Look for errors like:
- `Cannot read property of undefined`
- `MetaMask is not defined`
- `Uncaught TypeError`
- `Failed to fetch`

**If you see errors, copy them and let me know!**

### **Step 3: Test MetaMask Connection**
1. Make sure **MetaMask is installed and unlocked**
2. Check you're connected to the correct network
3. In Console tab, type this and press Enter:
   ```javascript
   window.ethereum ? "MetaMask detected" : "MetaMask not found"
   ```

### **Step 4: Monitor Network Requests**
1. Go to **Network** tab in Dev Tools
2. Click "Connect with MetaMask" button
3. Watch for:
   - ✅ `POST /api/auth/login` should return 200
   - ✅ Response should have `"success": true`
   - ⚠️  Look for any failed requests (red)

### **Step 5: Check Cookies**
1. Go to **Application** tab in Dev Tools
2. Expand **Cookies** in left sidebar
3. Click on `http://localhost:3000`
4. Look for **auth** cookie
   - Should appear after successful login
   - Should contain your wallet address and role

### **Step 6: Test Manual Login**
If MetaMask isn't working, test with curl:
```bash
# Copy this exact command and run in terminal:
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x241dBc6d5f283964536A94e33E2323B7580CE45A"}'

# Then test admin access:
curl -b cookies.txt http://localhost:3000/admin
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: MetaMask Not Connecting**
**Symptoms**: Button click does nothing, no MetaMask popup
**Solutions**:
- Install/enable MetaMask browser extension
- Unlock MetaMask wallet
- Refresh the page
- Try different browser

### **Issue 2: Wrong Wallet Address**
**Symptoms**: Login works but wrong role
**Solutions**:
- Check which wallet is active in MetaMask
- Switch to the correct account:
  - Admin: `0x241dBc6d5f283964536A94e33E2323B7580CE45A`
  - Issuer: `0x6ae5FfE48c1395260cF096134E5e32725c24080a`
  - Holder: `0x01178ee99F7E50957Ab591b0C7ca307E593254C9`

### **Issue 3: Cookies Not Working**
**Symptoms**: Login succeeds but redirects back to login
**Solutions**:
- Enable cookies in browser settings
- Clear all site data (DevTools → Application → Storage → Clear Storage)
- Try incognito mode
- Check if SameSite cookie restrictions are blocking

### **Issue 4: JavaScript Errors**
**Symptoms**: Page doesn't work, console shows errors
**Solutions**:
- Clear browser cache (Ctrl+Shift+R)
- Check if ad blockers are interfering
- Try different browser

## 🧪 **Quick Test Commands**

Run these in Browser Console to debug:

```javascript
// Test 1: Check MetaMask
console.log('MetaMask:', !!window.ethereum);

// Test 2: Check current page auth
console.log('Current URL:', window.location.href);
console.log('Cookies:', document.cookie);

// Test 3: Check localStorage
console.log('LocalStorage:', localStorage.getItem('walletAddress'));

// Test 4: Test API manually
fetch('/api/auth/verify-role', {credentials: 'include'})
  .then(r => r.json())
  .then(data => console.log('Auth Status:', data));
```

## ⚡ **Quick Fix Steps**

1. **Clear Everything**:
   - Press `Ctrl+Shift+Delete`
   - Clear cookies, cache, localStorage
   - Restart browser

2. **Reset MetaMask**:
   - Disconnect from site
   - Lock/unlock MetaMask
   - Connect again

3. **Try Incognito Mode**:
   - Open incognito/private window
   - Test login there

4. **Manual URL Test**:
   - After login, manually navigate to:
     - `http://localhost:3000/admin`
     - `http://localhost:3000/issuer`
     - `http://localhost:3000/holder`

## 📞 **Next Steps**

**Please check the browser console and let me know:**
1. Any JavaScript errors you see
2. What happens when you click "Connect with MetaMask"
3. Whether MetaMask popup appears
4. What shows in Network tab when you try to login
5. Whether auth cookie appears in Application tab

The server is working perfectly - we just need to identify what's happening in the browser! 🔍 