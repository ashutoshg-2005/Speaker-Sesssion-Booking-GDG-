import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOTP } from '../services/notification.service';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const router = Router();

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// Define scopes at the top level for reuse
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'profile',
  'email'
];

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

type AsyncRequestHandler = (req: Request, res: Response) => Promise<any>;

// Register user
const registerUser: AsyncRequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        otpCode: otp,
        otpExpires,
      },
    });

    await sendOTP(email, otp);

    res.status(201).json({ message: 'User registered. Please verify your email with OTP. Valid for 24 hours.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Register speaker
const registerSpeaker: AsyncRequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName, expertise, pricePerSession } = req.body;

    const existingSpeaker = await prisma.speaker.findUnique({ where: { email } });
    if (existingSpeaker) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const speaker = await prisma.speaker.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        expertise,
        pricePerSession,
        isVerified: false,
        otpCode: otp,
        otpExpires,
      },
    });

    await sendOTP(email, otp);

    res.status(201).json({ 
      message: 'Speaker registered. Please verify your email with OTP. Valid for 24 hours.',
      tempCode: otp // Only for testing, remove in production
    });
  } catch (error) {
    console.error('Speaker registration error:', error);
    res.status(500).json({ 
      message: 'Error registering speaker',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Verify OTP
const verifyOTP: AsyncRequestHandler = async (req, res) => {
  try {
    const { email, otp, userType } = req.body;
    const now = new Date();

    if (userType === 'USER') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.otpCode !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (user.otpExpires && user.otpExpires < now) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      await prisma.user.update({
        where: { email },
        data: { 
          isVerified: true,
          otpCode: null,
          otpExpires: null
        },
      });
    } else {
      const speaker = await prisma.speaker.findUnique({ where: { email } });
      if (!speaker || speaker.otpCode !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (speaker.otpExpires && speaker.otpExpires < now) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      await prisma.speaker.update({
        where: { email },
        data: { 
          isVerified: true,
          otpCode: null,
          otpExpires: null
        },
      });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

// Login
const login: AsyncRequestHandler = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (userType === 'USER') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email first' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, userType: 'USER' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      res.json({ token });
    } else {
      const speaker = await prisma.speaker.findUnique({ where: { email } });
      if (!speaker || !await bcrypt.compare(password, speaker.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!speaker.isVerified) {
        return res.status(401).json({ message: 'Please verify your email first' });
      }

      const token = jwt.sign(
        { id: speaker.id, email: speaker.email, userType: 'SPEAKER' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      res.json({ token });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Generate Google OAuth URL
router.get('/google/auth-url', (_req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: CALENDAR_SCOPES,
    prompt: 'consent' // Forces the consent screen to appear every time
  });
  res.json({ url });
});

// Google Calendar OAuth endpoint
router.get('/google/calendar', (_req: Request, res: Response) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: CALENDAR_SCOPES,
      prompt: 'consent',
      include_granted_scopes: true
    });

    console.log('Redirecting to Google OAuth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authentication URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Single OAuth2 callback handler for all Google auth flows
router.get('/oauth2callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    if (tokens.refresh_token) {
      // Save the refresh token to process.env
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      
      // Display the refresh token to the user (only in development)
      res.send(`
        <html>
          <body>
            <h1>Authentication successful!</h1>
            <p>Your refresh token is: ${tokens.refresh_token}</p>
            <p>Please copy this token and save it in your .env file as GOOGLE_REFRESH_TOKEN</p>
            <p style="color: red;">Important: This token will only be shown once!</p>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <body>
            <h1>No refresh token received</h1>
            <p>This usually happens when you've already authorized the application.</p>
            <p>To force a new refresh token:</p>
            <ol>
              <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
              <li>Remove access for this application</li>
              <li>Try authenticating again</li>
            </ol>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

router.post('/register/user', registerUser);
router.post('/register/speaker', registerSpeaker);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

export default router;