# 🧪 Manual Testing Instructions for Real Estate Application

## Prerequisites
- Backend running on http://localhost:5000
- Frontend running on http://localhost:5173
- Database seeded with test data

## 1. Authentication Testing

### A. User Registration & Login
1. Open http://localhost:5173
2. Click "Register" 
3. Fill form with:
   - Name: "Test User"
   - Email: "testuser@example.com"
   - Phone: "+919876543210"
   - Role: "User"
   - Password: "TestPass123!"
4. Submit registration
5. **Expected**: Success message or OTP verification screen
6. Login with same credentials
7. **Expected**: Redirect to user dashboard

### B. Agent Registration & Login
1. Register with:
   - Name: "Test Agent"
   - Email: "testagent@example.com"  
   - Phone: "+919876543211"
   - Role: "Agent"
   - Password: "TestPass123!"
2. **Expected**: Access to agent dashboard with property management

### C. Admin Login
1. Login with admin credentials (if available)
2. **Expected**: Access to admin dashboard with user management

## 2. Property Testing

### A. Property Browsing (User)
1. Navigate to homepage/properties
2. **Test**: Property cards display correctly
3. **Test**: Search and filter functionality
4. **Test**: Property detail view
5. **Test**: Image gallery
6. **Test**: Contact owner (should require OTP)

### B. Property Management (Agent)
1. Login as agent
2. Navigate to agent dashboard
3. **Test**: Add new property
4. **Test**: Edit existing property
5. **Test**: View property statistics
6. **Test**: Property status tracking

### C. Property Verification (Admin)
1. Login as admin
2. Navigate to admin dashboard
3. **Test**: View pending properties
4. **Test**: Approve property
5. **Test**: Reject property
6. **Test**: Real-time statistics update

## 3. API Endpoint Testing

### Manual API Tests (use Postman or browser console)

```javascript
// Test 1: Get all properties (public)
fetch('http://localhost:5000/api/properties')
  .then(r => r.json())
  .then(console.log);

// Test 2: Register user
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'API Test User',
    email: 'apitest@example.com',
    phone: '+919876543299',
    role: 'User',
    password: 'TestPass123!'
  })
}).then(r => r.json()).then(console.log);

// Test 3: Login user  
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'apitest@example.com',
    password: 'TestPass123!'
  })
}).then(r => r.json()).then(console.log);
```

## 4. Expected Results Checklist

### ✅ Authentication Flow
- [ ] User registration works
- [ ] Agent registration works  
- [ ] Login redirects to appropriate dashboard
- [ ] Protected routes are secured
- [ ] Logout works correctly

### ✅ User Features
- [ ] Property browsing works
- [ ] Search and filters work
- [ ] Property details load
- [ ] Recently viewed tracking
- [ ] Favorites functionality (if implemented)

### ✅ Agent Features  
- [ ] Property creation works
- [ ] Property editing works
- [ ] Property deletion works
- [ ] Form validation works
- [ ] Image upload works
- [ ] Statistics display correctly

### ✅ Admin Features
- [ ] Dashboard statistics load
- [ ] Property verification works
- [ ] User management works
- [ ] System activities display
- [ ] Real-time data updates

### ✅ API Integration
- [ ] All endpoints respond correctly
- [ ] Error handling works
- [ ] Data validation works
- [ ] Authorization checks work

## 5. Known Issues to Verify

1. **Twilio Warning**: OTP functionality disabled (expected)
2. **Activity Logging**: Should work without errors now
3. **CORS**: Frontend should connect to backend
4. **Database**: Seeded data should display

## 6. Performance Testing

1. **Load Time**: Pages should load within 2-3 seconds
2. **Image Loading**: Property images should load correctly
3. **Search Response**: Search should be fast and responsive
4. **Mobile Responsiveness**: Test on different screen sizes

## 7. Error Handling Testing

1. **Invalid Login**: Should show appropriate error
2. **Network Errors**: Should handle gracefully
3. **Validation Errors**: Should show field-specific messages
4. **Unauthorized Access**: Should redirect to login

---

## Quick Success Verification

If all these work, the application is functioning correctly:

1. ✅ Can register and login users
2. ✅ Can browse and view properties  
3. ✅ Agents can manage properties
4. ✅ Admin can verify properties
5. ✅ Real-time data loads from database
6. ✅ All dashboards display correctly
