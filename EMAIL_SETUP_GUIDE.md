# 📧 Gmail App Password Setup Guide

## Problem
Your email service is failing to authenticate with Gmail SMTP because the credentials are missing or incorrect.

## Solution: Set up Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com
2. Navigate to **Security** → **2-Step Verification**
3. Click **Get Started** and follow the setup process
4. Choose your preferred 2FA method (SMS, Authenticator app, etc.)

### Step 2: Generate App Password
1. In Google Account settings, go to **Security** → **App passwords**
2. Sign in again if prompted
3. Under "App passwords" section, click **Create**
4. Select **Mail** as the app
5. Choose **Other (custom name)** and enter "Real Estate Connect"
6. Click **Generate**
7. **Copy the 16-character password** (it will look like: `abcd-efgh-ijkl-mnop`)

### Step 3: Update Your .env File
Add these lines to your `.env` file in the backend directory:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Use the **16-character App Password**, NOT your regular Gmail password
- The App Password will only be shown once, so copy it immediately
- Never share your App Password with anyone

### Step 4: Test the Configuration
Run the test script to verify everything works:

```bash
node test_email_production.js
```

## Troubleshooting

### "Missing credentials for PLAIN"
- Make sure both `EMAIL_USER` and `EMAIL_PASS` are set in your `.env` file
- Verify the App Password is exactly 16 characters with dashes

### "Authentication failed"
- Double-check that 2FA is enabled on your Gmail account
- Regenerate the App Password if you're unsure
- Make sure you're using the App Password, not your regular password

### "Invalid credentials"
- Try generating a new App Password
- Ensure you're using the correct Gmail address
- Check if your Gmail account is locked or has security restrictions

## Security Best Practices

✅ **Do:**
- Use App Passwords instead of regular passwords
- Keep your `.env` file secure and never commit it to version control
- Use a dedicated Gmail account for your application
- Monitor your Gmail account for suspicious activity

❌ **Don't:**
- Share your App Password with anyone
- Use your personal Gmail password for applications
- Commit `.env` files to version control
- Use the same App Password for multiple applications

## Need Help?

If you're still having issues:
1. Double-check that 2FA is enabled
2. Try generating a new App Password
3. Verify the email address is correct
4. Test with a different Gmail account

The error messages in your console will provide specific guidance about what's wrong with your configuration.
