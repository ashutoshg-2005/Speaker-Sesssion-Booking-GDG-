import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { convertToUTC } from '../utils/time.utils';

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// For development only - use test users
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

export const sendOTP = async (email: string, otp: string) => {
  try {
    console.log('Attempting to send OTP to:', email);
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification OTP',
      html: `
        <h1>Email Verification</h1>
        <p>Your OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP will be valid for 24 hours.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email: ' + (error as Error).message);
  }
};

export const sendSessionConfirmation = async (
  userEmail: string,
  speakerEmail: string,
  sessionDetails: any
) => {
  // Send email to user
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: userEmail,
    subject: 'Session Booking Confirmation',
    html: `
      <h1>Session Booking Confirmed</h1>
      <p>Your session has been confirmed with the following details (All times in IST):</p>
      <ul>
        <li>Date: ${sessionDetails.date}</li>
        <li>Time: ${sessionDetails.startTime} - ${sessionDetails.endTime}</li>
        <li>Speaker: ${sessionDetails.speakerName}</li>
      </ul>
    `,
  });

  // Send email to speaker
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: speakerEmail,
    subject: 'New Session Booking',
    html: `
      <h1>New Session Booking</h1>
      <p>You have a new session booking with the following details (All times in IST):</p>
      <ul>
        <li>Date: ${sessionDetails.date}</li>
        <li>Time: ${sessionDetails.startTime} - ${sessionDetails.endTime}</li>
        <li>User: ${sessionDetails.userName}</li>
      </ul>
    `,
  });
};

export const sendSessionCancellation = async (
  userEmail: string,
  speakerEmail: string,
  sessionDetails: any
) => {
  try {
    // Send email to user
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: 'Session Cancellation Confirmation',
      html: `
        <h1>Session Successfully Cancelled</h1>
        <p>Your session has been cancelled with the following details (All times in IST):</p>
        <ul>
          <li>Date: ${sessionDetails.date}</li>
          <li>Time: ${sessionDetails.startTime} - ${sessionDetails.endTime}</li>
          <li>Speaker: ${sessionDetails.speakerName}</li>
        </ul>
        <p>Thank you for using our service. You can book another session anytime.</p>
      `,
    });

    // Send email to speaker
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: speakerEmail,
      subject: 'Session Cancellation Notification',
      html: `
        <h1>Session Cancellation Notice</h1>
        <p>A user has cancelled a session with the following details (All times in IST):</p>
        <ul>
          <li>Date: ${sessionDetails.date}</li>
          <li>Time: ${sessionDetails.startTime} - ${sessionDetails.endTime}</li>
          <li>User: ${sessionDetails.userName}</li>
        </ul>
        <p>This time slot is now available for booking again.</p>
      `,
    });

    console.log('Cancellation emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending cancellation emails:', error);
    throw new Error('Failed to send cancellation emails: ' + (error as Error).message);
  }
};

export const getGoogleAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar'
    ],
    prompt: 'consent'
  });
};

export const createCalendarEvent = async (
  userEmail: string,
  speakerEmail: string,
  sessionDetails: any
) => {
  try {
    // Check if Google Calendar integration is configured
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      return {
        success: false,
        needsAuth: true,
        authUrl: getGoogleAuthUrl(),
        message: 'Google Calendar integration not configured. Please authenticate first.'
      };
    }

    // Set credentials if refresh token exists
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parse the date and time strings properly
    const [day, month, year] = sessionDetails.date.split('/');
    const [startHours, startMinutes] = sessionDetails.startTime.split(':');
    const [endHours, endMinutes] = sessionDetails.endTime.split(':');

    // Create Date objects with explicit IST timezone representation
    // Note: We're creating dates in local time but specifying they represent IST times
    const startDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-based
      parseInt(day),
      parseInt(startHours),
      parseInt(startMinutes)
    );

    const endDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(endHours),
      parseInt(endMinutes)
    );

    // No need to convert to UTC - instead use the ISO string with correct timezone
    const event = {
      summary: 'Speaker Session',
      description: `Session with ${sessionDetails.speakerName}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Kolkata', // Explicitly set IST timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Kolkata', // Explicitly set IST timezone
      },
      attendees: [
        { email: userEmail },
        { email: speakerEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      sendUpdates: 'all'
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendNotifications: true
    });

    console.log('Calendar event created:', response.data.htmlLink);
    return {
      success: true,
      eventUrl: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      needsAuth: true,
      authUrl: getGoogleAuthUrl(),
      message: 'Failed to create calendar event. Please re-authenticate with Google Calendar.'
    };
  }
};