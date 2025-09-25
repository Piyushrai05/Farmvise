const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Twilio client configuration
const createTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('Twilio credentials not configured');
    return null;
  }
  
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

// Send OTP via email
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'FarmWise - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🌱 FarmWise</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Gamified Platform for Sustainable Farming</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Welcome to FarmWise! Please verify your email address to get started with your sustainable farming journey.
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px solid #4CAF50;">
              <p style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: bold;">Your Verification Code</p>
              <div style="background: #4CAF50; color: white; font-size: 32px; font-weight: bold; padding: 15px 25px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2024 FarmWise. All rights reserved.<br>
                Promoting sustainable farming practices worldwide.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
    
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send OTP via SMS
const sendOTPSMS = async (phone, otp) => {
  try {
    const client = createTwilioClient();
    
    if (!client) {
      console.warn('Twilio client not available, skipping SMS');
      return false;
    }
    
    const message = await client.messages.create({
      body: `FarmWise verification code: ${otp}. This code expires in 10 minutes. Don't share it with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    console.log(`OTP SMS sent to ${phone}, SID: ${message.sid}`);
    return true;
    
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error('Failed to send OTP SMS');
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to FarmWise - Start Your Sustainable Farming Journey!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🌱 Welcome to FarmWise!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your Sustainable Farming Journey Begins Now</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Congratulations! Your email has been verified and you're now part of the FarmWise community. 
              Get ready to embark on an exciting journey of sustainable farming practices!
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4CAF50;">
              <h3 style="color: #333; margin-top: 0;">🎯 What's Next?</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Complete your farming profile to get personalized challenges</li>
                <li>Join daily and weekly sustainability challenges</li>
                <li>Earn points and unlock badges for your achievements</li>
                <li>Connect with other farmers in your community</li>
                <li>Access learning modules and expert resources</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Start Your Journey
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2024 FarmWise. All rights reserved.<br>
                Promoting sustainable farming practices worldwide.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
    
  } catch (error) {
    console.error('Welcome email sending failed:', error);
    throw new Error('Failed to send welcome email');
  }
};

// Send challenge notification email
const sendChallengeNotificationEmail = async (email, firstName, challengeTitle, challengePoints) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New Challenge Available: ${challengeTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF9800, #F57C00); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🏆 New Challenge!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Earn ${challengePoints} points</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              A new challenge is waiting for you! Complete "${challengeTitle}" and earn ${challengePoints} points to level up your sustainable farming journey.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/challenges" 
                 style="background: #FF9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                View Challenge
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2024 FarmWise. All rights reserved.<br>
                Promoting sustainable farming practices worldwide.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Challenge notification email sent to ${email}`);
    return true;
    
  } catch (error) {
    console.error('Challenge notification email sending failed:', error);
    throw new Error('Failed to send challenge notification email');
  }
};

module.exports = {
  sendOTPEmail,
  sendOTPSMS,
  sendWelcomeEmail,
  sendChallengeNotificationEmail
};
