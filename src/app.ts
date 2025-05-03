import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

// Routes
import authRoutes from './routes/auth.routes';
import speakerRoutes from './routes/speaker.routes';
import sessionRoutes from './routes/session.routes';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// Middleware
app.use(cors());
app.use(express.json());

// Root route with API documentation
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Speaker Session Booking API',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: {
          registerUser: 'POST /api/auth/register/user',
          registerSpeaker: 'POST /api/auth/register/speaker',
          verifyOTP: 'POST /api/auth/verify-otp',
          login: 'POST /api/auth/login'
        }
      },
      speakers: {
        base: '/api/speakers',
        routes: {
          getAllSpeakers: 'GET /api/speakers',
          updateProfile: 'PUT /api/speakers/profile',
          createTimeSlots: 'POST /api/speakers/time-slots',
          getTimeSlots: 'GET /api/speakers/time-slots'
        }
      },
      sessions: {
        base: '/api/sessions',
        routes: {
          bookSession: 'POST /api/sessions/book',
          getMySessions: 'GET /api/sessions/my-sessions',
          cancelSession: 'DELETE /api/sessions/:sessionId'
        }
      }
    }
  });
});

// OAuth2 callback route
app.get('/oauth2callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    if (tokens.refresh_token) {
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      
      res.send(`
        <html>
          <body>
            <h1>Authentication successful!</h1>
            <p>Calendar integration has been configured.</p>
            <p>You can close this window now.</p>
          </body>
        </html>
      `);
    } else {
      res.status(400).send('No refresh token received. Please try again and make sure to approve all permissions.');
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});