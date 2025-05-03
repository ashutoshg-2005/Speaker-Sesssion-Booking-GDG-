# Speaker Session Booking API

A RESTful API for managing speaker session bookings, built with Node.js, Express, TypeScript, and MongoDB.

<p align="center">
  <img src="Screenshot 2025-05-03 210426.png" width="400" alt="Session Booking Screenshot">
</p>

## Overview

This application provides a platform for users to book sessions with tech speakers. It includes features for user and speaker registration, authentication, session booking, and management with email notifications and Google Calendar integration.

## Features

- **User and Speaker Management**: Register, verify, and authenticate users and speakers
- **Session Scheduling**: Create, book, and manage time slots for sessions
- **Email Notifications**: Send confirmation emails for bookings and cancellations
- **Google Calendar Integration**: Create calendar events for booked sessions
- **Timezone Handling**: Support for UTC and IST time zones

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT, OTP-based email verification
- **Email**: Nodemailer
- **Calendar**: Google Calendar API

## Documentation

Comprehensive API documentation is available in the [docs](/docs) folder:

- [API Documentation](/docs/API.md) - Detailed API endpoint specifications
- [Postman Guide](/docs/POSTMAN.md) - Instructions for using the Postman collection

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- SMTP server for email functionality
- Google API credentials (for calendar integration)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/speaker-session-booking-api.git
   cd speaker-session-booking-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   # Server
   PORT=3000
   
   # Database
   DATABASE_URL=mongodb://localhost:27017/speaker-session-api
   
   # JWT
   JWT_SECRET=your_jwt_secret
   
   # SMTP (for email)
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   
   # Google Calendar API
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth2callback
   ```

4. Initialize Prisma:
   ```bash
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Testing

A Postman collection (`Speaker Session Booking API.postman_collection.json`) is included in the repository for testing the API endpoints. Follow the [Postman Guide](/docs/POSTMAN.md) for detailed instructions on importing and using the collection.

## Email Notification Samples

Below are examples of the email notifications sent by the system:

| Email Type | Description | Screenshot |
|------------|-------------|------------|
| User OTP Verification | Email with OTP sent to users during registration | [View](Screenshot%202025-05-03%20205626.png) |
| Speaker OTP Verification | Email with OTP sent to speakers during registration | [View](Screenshot%202025-05-03%20205802.png) |
| User Session Booking | Confirmation email sent to users after booking a session | [View](Screenshot%202025-05-03%20210426.png) |
| Speaker Session Booking | Notification email sent to speakers when a session is booked | [View](Screenshot%202025-05-03%20210519.png) |
| User Calendar Invite | Calendar invitation sent to users | [View](Screenshot%202025-05-03%20210501.png) |
| Speaker Calendar Invite | Calendar invitation sent to speakers | [View](Screenshot%202025-05-03%20210532.png) |
| User Session Cancellation | Confirmation email sent to users after cancelling a session | [View](Screenshot%202025-05-03%20210638.png) |
| Speaker Session Cancellation | Notification email sent to speakers when a session is cancelled | [View](Screenshot%202025-05-03%20210625.png) |

## Timezone Handling

All dates and times are stored in UTC. The API handles conversions to and from IST (UTC+5:30) where necessary. Time slots are restricted to business hours (9 AM to 4 PM IST).

## License

[MIT](LICENSE)