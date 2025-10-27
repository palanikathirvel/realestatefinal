const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.isConfigured = false;
    this.transporter = null;

    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in .env file');
      console.error('💡 To set up Gmail App Password:');
      console.error('   1. Enable 2FA on your Gmail account');
      console.error('   2. Go to Google Account settings > Security > App passwords');
      console.error('   3. Generate a new App Password for "Mail"');
      console.error('   4. Use the App Password (16 characters) as EMAIL_PASS');
      this.isConfigured = false;
      return;
    }

    // Initialize transporter
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          ciphers: 'TLSv1.2', // Updated to use TLS 1.2
          rejectUnauthorized: false
        },
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      });

      console.log('📧 Email transporter created successfully');
      this.isConfigured = true;

      // Verify connection on startup
      this.initializeEmailService();
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error.message);
      this.isConfigured = false;
      this.transporter = null;
    }
  }

  async initializeEmailService() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      this.isConfigured = true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.error('💡 Please check your EMAIL_USER and EMAIL_PASS in .env file');
      console.error('💡 Make sure you have enabled 2FA and generated an App Password for Gmail');
      this.isConfigured = false;
    }
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  async sendOTPEmail(userEmail, userName, otp) {
    try {
      console.log(`📧 Attempting to send OTP email to: ${userEmail}`);

      // Check if transporter is initialized
      if (!this.transporter) {
        console.error('❌ Email transporter not initialized');
        throw new Error('Email service not properly configured');
      }

      // Validate inputs
      if (!userEmail || !userName || !otp) {
        throw new Error('Missing required parameters: userEmail, userName, or otp');
      }

      // Create email options
      const mailOptions = {
        from: {
          name: 'Real Estate Connect',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: 'Your OTP for Real Estate Connect Registration',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { text-align: center; padding: 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .otp-box { background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; }
              .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 Real Estate Connect</h1>
                <p>Account Verification</p>
              </div>

              <h2>Hello ${userName}! 👋</h2>

              <p>Welcome to <strong>Real Estate Connect</strong>! We're excited to have you join our platform.</p>

              <p>To complete your registration, please verify your email address using the OTP below:</p>

              <div class="otp-box">
                <p><strong>Your One-Time Password (OTP) is:</strong></p>
                <div class="otp-code">${otp}</div>
                <p>⏰ <em>This OTP will expire in 5 minutes</em></p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This OTP is confidential. Never share it with anyone.</li>
                  <li>Our team will never ask for your OTP via phone or email.</li>
                  <li>If you didn't request this OTP, please ignore this email.</li>
                </ul>
              </div>

              <p>Once verified, you'll have access to:</p>
              <ul>
                <li>🔍 Browse premium properties</li>
                <li>💼 Professional real estate services</li>
                <li>📞 Direct contact with verified agents</li>
                <li>⭐ Personalized property recommendations</li>
              </ul>

              <div class="footer">
                <p><strong>Real Estate Connect Team</strong></p>
                <p>📧 realestateconnect07@gmail.com</p>
                <p>🌐 Your trusted property partner</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                <p style="font-size: 12px; color: #999;">
                  This is an automated email. Please do not reply to this message.
                  <br>© 2025 Real Estate Connect. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      // Attempt to send email
      console.log('📤 Sending email via Gmail SMTP...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log(`✅ OTP email sent successfully to ${userEmail}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📅 Sent at: ${new Date().toISOString()}`);

      return {
        success: true,
        messageId: result.messageId,
        email: userEmail,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error sending OTP email:', error);

      // Log detailed error information
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.responseCode) {
        console.error('Response code:', error.responseCode);
      }
      if (error.command) {
        console.error('Failed command:', error.command);
      }

      // Provide helpful troubleshooting information
      console.error('\n💡 Troubleshooting tips:');
      console.error('1. Check if EMAIL_USER and EMAIL_PASS are correct in .env');
      console.error('2. Verify Gmail App Password is enabled and correct');
      console.error('3. Check if Gmail account has 2FA enabled');
      console.error('4. Ensure Gmail account allows less secure apps or use App Password');
      console.error('5. Check if the recipient email address is valid');

      return {
        success: false,
        error: error.message,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(userEmail, userName, userRole) {
    try {
      console.log(`📧 Sending welcome email to: ${userEmail}`);
      
      const roleMessages = {
        user: {
          title: 'Welcome to Real Estate Connect! 🏠',
          message: 'Start exploring amazing properties today!',
          features: [
            '🔍 Search thousands of verified properties',
            '💰 Get instant price estimates', 
            '📞 Connect with verified agents',
            '⭐ Save your favorite properties'
          ]
        },
        agent: {
          title: 'Welcome to Real Estate Connect Agent Portal! 💼',
          message: 'Start listing properties and grow your business!',
          features: [
            '📝 List unlimited properties',
            '🎯 Reach thousands of buyers',
            '📊 Track your property performance',
            '🤝 Build your professional network'
          ]
        }
      };

      const roleInfo = roleMessages[userRole] || roleMessages.user;

      const mailOptions = {
        from: {
          name: 'Real Estate Connect',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: `${roleInfo.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Real Estate Connect</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { text-align: center; padding: 20px 0; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .welcome-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; padding: 25px; text-align: center; margin: 20px 0; }
              .features { background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Account Verified Successfully!</h1>
                <p>Welcome to Real Estate Connect</p>
              </div>
              
              <div class="welcome-box">
                <h2>Hello ${userName}! 👋</h2>
                <p><strong>${roleInfo.message}</strong></p>
              </div>
              
              <p>Your email has been successfully verified and your account is now active!</p>
              
              <div class="features">
                <h3>🚀 What you can do now:</h3>
                <ul>
                  ${roleInfo.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
              </div>
              
              <p>Ready to get started? Log in to your dashboard and explore all the features we have to offer.</p>
              
              <div class="footer">
                <p><strong>Real Estate Connect Team</strong></p>
                <p>📧 realestateconnect07@gmail.com</p>
                <p>🌐 Your trusted property partner</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                <p style="font-size: 12px; color: #999;">
                  © 2025 Real Estate Connect. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent successfully to ${userEmail}. Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset OTP email
  async sendPasswordResetOTP(userEmail, userName, otp) {
    try {
      console.log(`📧 Sending password reset OTP to: ${userEmail}`);

      if (!this.transporter) {
        console.error('❌ Email transporter not initialized');
        throw new Error('Email service not properly configured');
      }

      if (!userEmail || !userName || !otp) {
        throw new Error('Missing required parameters: userEmail, userName, or otp');
      }

      const mailOptions = {
        from: {
          name: 'Real Estate Connect',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: 'Password Reset OTP - Real Estate Connect',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { text-align: center; padding: 20px 0; background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .otp-box { background-color: #f8f9fa; border: 2px dashed #dc3545; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; margin: 10px 0; }
              .warning { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0; color: #721c24; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Real Estate Connect</h1>
                <p>Password Reset Request</p>
              </div>

              <h2>Hello ${userName}! 👋</h2>

              <p>We received a request to reset your password for your <strong>Real Estate Connect</strong> account.</p>

              <p>To reset your password, please use the OTP below:</p>

              <div class="otp-box">
                <p><strong>Your Password Reset OTP is:</strong></p>
                <div class="otp-code">${otp}</div>
                <p>⏰ <em>This OTP will expire in 10 minutes</em></p>
              </div>

              <div class="warning">
                <strong>🔒 Security Notice:</strong>
                <ul>
                  <li>This OTP is confidential. Never share it with anyone.</li>
                  <li>Our team will never ask for your OTP via phone or email.</li>
                  <li>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</li>
                  <li>For your security, this OTP will expire in 10 minutes.</li>
                </ul>
              </div>

              <p>After entering the OTP, you'll be able to set a new password for your account.</p>

              <p><strong>Didn't request a password reset?</strong><br>
              If you didn't request this password reset, you can safely ignore this email. Your account remains secure.</p>

              <div class="footer">
                <p><strong>Real Estate Connect Team</strong></p>
                <p>📧 realestateconnect07@gmail.com</p>
                <p>🌐 Your trusted property partner</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                <p style="font-size: 12px; color: #999;">
                  This is an automated email. Please do not reply to this message.
                  <br>© 2025 Real Estate Connect. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset OTP sent successfully to ${userEmail}. Message ID: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId,
        email: userEmail,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error sending password reset OTP:', error);
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Send password change confirmation email
  async sendPasswordChangeConfirmation(userEmail, userName) {
    try {
      console.log(`📧 Sending password change confirmation to: ${userEmail}`);

      if (!this.transporter) {
        console.error('❌ Email transporter not initialized');
        throw new Error('Email service not properly configured');
      }

      const mailOptions = {
        from: {
          name: 'Real Estate Connect',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: 'Password Changed Successfully - Real Estate Connect',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { text-align: center; padding: 20px 0; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; color: #155724; }
              .security-tips { background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Real Estate Connect</h1>
                <p>Password Changed Successfully</p>
              </div>

              <h2>Hello ${userName}! 👋</h2>

              <div class="success-box">
                <h3>🔐 Password Updated Successfully!</h3>
                <p>Your password has been changed successfully on <strong>${new Date().toLocaleString()}</strong></p>
              </div>

              <p>Your <strong>Real Estate Connect</strong> account password has been successfully updated. You can now log in with your new password.</p>

              <div class="security-tips">
                <h3>🛡️ Security Tips:</h3>
                <ul>
                  <li>Keep your password confidential and don't share it with anyone</li>
                  <li>Use a strong, unique password for your account</li>
                  <li>Consider enabling two-factor authentication if available</li>
                  <li>Log out from shared or public computers</li>
                  <li>Monitor your account for any suspicious activity</li>
                </ul>
              </div>

              <p><strong>Didn't change your password?</strong><br>
              If you didn't make this change, please contact our support team immediately at realestateconnect07@gmail.com</p>

              <div class="footer">
                <p><strong>Real Estate Connect Team</strong></p>
                <p>📧 realestateconnect07@gmail.com</p>
                <p>🌐 Your trusted property partner</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                <p style="font-size: 12px; color: #999;">
                  This is an automated email. Please do not reply to this message.
                  <br>© 2025 Real Estate Connect. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password change confirmation sent successfully to ${userEmail}. Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error sending password change confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  // Send generic email
  async sendEmail({ to, subject, html, text }) {
    try {
      console.log(`📧 Sending email to: ${to}`);

      if (!this.transporter) {
        console.error('❌ Email transporter not initialized');
        throw new Error('Email service not properly configured');
      }

      const mailOptions = {
        from: {
          name: 'Real Estate Connect',
          address: process.env.EMAIL_USER
        },
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}. Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
