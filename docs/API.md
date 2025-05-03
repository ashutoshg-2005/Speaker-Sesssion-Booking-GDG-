# Speaker Session Booking API Documentation

## Introduction

This API allows users to book session time slots with speakers who have expertise in various technologies. The application supports user and speaker registration, authentication, session booking, and management.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication

#### Register User

- **URL**: `/api/auth/register/user`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
}
```
- **Description**: This endpoint is used to register a new user.
- **Success Response**: 
  - Status: 201 Created
  - Content: 
```json
{
    "message": "User registered. Please verify your email with OTP. Valid for 24 hours."
}
```

#### Register Speaker

- **URL**: `/api/auth/register/speaker`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
    "email": "speaker@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "expertise": ["JavaScript", "Node.js"],
    "pricePerSession": 50
}
```
- **Description**: This endpoint allows users to register as a speaker.
- **Success Response**: 
  - Status: 201 Created
  - Content: 
```json
{
    "message": "Speaker registered. Please verify your email with OTP. Valid for 24 hours.",
    "tempCode": "123456"
}
```

#### Verify OTP

- **URL**: `/api/auth/verify-otp`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
    "email": "user@example.com",
    "otp": "123456",
    "userType": "USER"  // or "SPEAKER"
}
```
- **Description**: This endpoint allows the user to verify their OTP for authentication.
- **Success Response**: 
  - Status: 200 OK
  - Content: 
```json
{
    "message": "Email verified successfully"
}
```

#### Login User/Speaker

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
    "email": "user@example.com",
    "password": "password123",
    "userType": "USER"  // or "SPEAKER"
}
```
- **Description**: This endpoint allows users to log in and obtain an authentication token.
- **Success Response**: 
  - Status: 200 OK
  - Content: 
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Speakers

#### Get All Speakers

- **URL**: `/api/speakers`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: This endpoint retrieves a list of speakers.
- **Success Response**: 
  - Status: 200 OK
  - Content: 
```json
[
    {
        "id": "speaker_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "expertise": [
            "JavaScript",
            "Node.js"
        ],
        "pricePerSession": 50,
        "timeSlots": []
    }
]
```

#### Update Speaker Profile

- **URL**: `/api/speakers/profile`
- **Method**: `PUT`
- **Auth Required**: Yes (Speaker only)
- **Body**:
```json
{
    "expertise": ["JavaScript", "Node.js", "React"],
    "pricePerSession": 75
}
```
- **Description**: This endpoint allows the client to update the profile of a speaker.
- **Success Response**: 
  - Status: 200 OK
  - Content: 
```json
{
    "id": "speaker_id",
    "email": "speaker@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "expertise": [
        "JavaScript",
        "Node.js",
        "React"
    ],
    "pricePerSession": 75,
    "isVerified": true,
    "createdAt": "2025-05-03T15:27:33.352Z",
    "updatedAt": "2025-05-03T15:30:50.500Z"
}
```

#### Create Time Slots

- **URL**: `/api/speakers/time-slots`
- **Method**: `POST`
- **Auth Required**: Yes (Speaker only)
- **Body**:
```json
{
    "date": "2025-05-04",
    "slots": [
        {
            "startTime": "2025-05-04T04:30:00.000Z",  // 10:00 AM IST
            "endTime": "2025-05-04T05:30:00.000Z"     // 11:00 AM IST
        },
        {
            "startTime": "2025-05-04T06:30:00.000Z",  // 12:00 PM IST
            "endTime": "2025-05-04T07:30:00.000Z"     // 1:00 PM IST
        }
    ]
}
```
- **Description**: This endpoint allows you to add time slots for speakers on a specific date.
- **Success Response**: 
  - Status: 201 Created
  - Content: 
```json
[
    {
        "id": "timeslot_id_1",
        "speakerId": "speaker_id",
        "date": "2025-05-03T18:30:00.000Z",
        "startTime": "2025-05-03T23:00:00.000Z",
        "endTime": "2025-05-04T00:00:00.000Z",
        "isBooked": false,
        "createdAt": "2025-05-03T15:31:42.317Z",
        "updatedAt": "2025-05-03T15:31:42.317Z"
    },
    {
        "id": "timeslot_id_2",
        "speakerId": "speaker_id",
        "date": "2025-05-03T18:30:00.000Z",
        "startTime": "2025-05-04T01:00:00.000Z",
        "endTime": "2025-05-04T02:00:00.000Z",
        "isBooked": false,
        "createdAt": "2025-05-03T15:31:42.317Z",
        "updatedAt": "2025-05-03T15:31:42.317Z"
    }
]
```

#### Get Speaker's Time Slots

- **URL**: `/api/speakers/time-slots`
- **Method**: `GET`
- **Auth Required**: Yes (Speaker only)
- **Description**: The endpoint retrieves a list of time slots for speakers.
- **Success Response**: 
  - Status: 200 OK
  - Content: 
```json
[
    {
        "id": "timeslot_id_1",
        "speakerId": "speaker_id",
        "date": "2025-05-03T18:30:00.000Z",
        "startTime": "2025-05-03T23:00:00.000Z",
        "endTime": "2025-05-04T00:00:00.000Z",
        "isBooked": false,
        "createdAt": "2025-05-03T15:31:42.317Z",
        "updatedAt": "2025-05-03T15:31:42.317Z",
        "session": null
    },
    {
        "id": "timeslot_id_2",
        "speakerId": "speaker_id",
        "date": "2025-05-03T18:30:00.000Z",
        "startTime": "2025-05-04T01:00:00.000Z",
        "endTime": "2025-05-04T02:00:00.000Z",
        "isBooked": false,
        "createdAt": "2025-05-03T15:31:42.317Z",
        "updatedAt": "2025-05-03T15:31:42.317Z",
        "session": null
    }
]
```

### Sessions

#### Book Session

- **URL**: `/api/sessions/book`
- **Method**: `POST`
- **Auth Required**: Yes (User only)
- **Body**:
```json
{
    "timeSlotId": "timeslot_id_1"
}
```
- **Description**: This endpoint allows the user to book a new session.
- **Success Response**: 
  - Status: 201 Created
  - Content: 
```json
{
    "id": "session_id",
    "userId": "user_id",
    "speakerId": "speaker_id",
    "timeSlotId": "timeslot_id_1",
    "status": "PENDING",
    "createdAt": "2025-05-03T15:33:43.786Z",
    "updatedAt": "2025-05-03T15:33:43.786Z",
    "user": {
        "id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "isVerified": true,
        "userType": "USER",
        "createdAt": "2025-05-03T15:25:53.360Z",
        "updatedAt": "2025-05-03T15:26:58.881Z"
    },
    "speaker": {
        "id": "speaker_id",
        "email": "speaker@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "expertise": [
            "JavaScript",
            "Node.js",
            "React"
        ],
        "pricePerSession": 75,
        "isVerified": true,
        "createdAt": "2025-05-03T15:27:33.352Z",
        "updatedAt": "2025-05-03T15:30:50.500Z"
    },
    "timeSlot": {
        "id": "timeslot_id_1",
        "speakerId": "speaker_id",
        "date": "2025-05-03T18:30:00.000Z",
        "startTime": "2025-05-03T23:00:00.000Z",
        "endTime": "2025-05-04T00:00:00.000Z",
        "isBooked": false,
        "createdAt": "2025-05-03T15:31:42.317Z",
        "updatedAt": "2025-05-03T15:31:42.317Z"
    },
    "calendar": {
        "eventUrl": "https://www.google.com/calendar/event?eid=example"
    }
}
```

#### Get User's Sessions

- **URL**: `/api/sessions/my-sessions`
- **Method**: `GET`
- **Auth Required**: Yes (User only)
- **Description**: The endpoint retrieves sessions associated with the current user.
- **Success Response**: 
  - Status: 200 OK
  - Content: 
```json
[
    {
        "id": "session_id",
        "userId": "user_id",
        "speakerId": "speaker_id",
        "timeSlotId": "timeslot_id_1",
        "status": "PENDING",
        "createdAt": "2025-05-03T15:33:43.786Z",
        "updatedAt": "2025-05-03T15:33:43.786Z",
        "speaker": {
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "speaker@example.com",
            "expertise": [
                "JavaScript",
                "Node.js",
                "React"
            ]
        },
        "timeSlot": {
            "id": "timeslot_id_1",
            "speakerId": "speaker_id",
            "date": "2025-05-03T18:30:00.000Z",
            "startTime": "2025-05-03T23:00:00.000Z",
            "endTime": "2025-05-04T00:00:00.000Z",
            "isBooked": true,
            "createdAt": "2025-05-03T15:31:42.317Z",
            "updatedAt": "2025-05-03T15:33:44.255Z"
        }
    }
]
```

#### Cancel Session

- **URL**: `/api/sessions/:sessionId`
- **Method**: `DELETE`
- **Auth Required**: Yes (User only)
- **Description**: This endpoint is used to delete a specific session.
- **Success Response**: 
  - Status: 200 OK
  - Content: 
```json
{
    "message": "Session cancelled successfully"
}
```

#### Confirm Session (Speaker only)

- **URL**: `/api/sessions/:sessionId/confirm`
- **Method**: `PUT`
- **Auth Required**: Yes (Speaker only)
- **Description**: This endpoint allows a speaker to confirm a pending session.
- **Success Response**: 
  - Status: 200 OK
  - Content:
```json
{
    "id": "session_id",
    "userId": "user_id",
    "speakerId": "speaker_id",
    "timeSlotId": "timeslot_id_1",
    "status": "CONFIRMED",
    "createdAt": "2025-05-03T15:33:43.786Z",
    "updatedAt": "2025-05-03T15:45:22.123Z",
    "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com"
    },
    "speaker": {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "speaker@example.com"
    },
    "timeSlot": {
        "date": "2025-05-03T18:30:00.000Z",
        "startTime": "2025-05-03T23:00:00.000Z",
        "endTime": "2025-05-04T00:00:00.000Z"
    }
}
```

## Error Responses

- **400 Bad Request**: Invalid input data
  ```json
  {
      "message": "Invalid input",
      "detail": "Time slot is outside business hours (9 AM to 4 PM IST)"
  }
  ```

- **401 Unauthorized**: Missing or invalid authentication
  ```json
  {
      "message": "Unauthorized"
  }
  ```

- **403 Forbidden**: Not authorized to access the resource
  ```json
  {
      "message": "Not authorized to confirm this session"
  }
  ```

- **404 Not Found**: Resource not found
  ```json
  {
      "message": "Session not found"
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
      "message": "Error booking session",
      "detail": "Internal server error"
  }
  ```

## Data Structures

### User

```json
{
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isVerified": true,
    "userType": "USER",
    "createdAt": "2025-05-03T15:25:53.360Z",
    "updatedAt": "2025-05-03T15:26:58.881Z"
}
```

### Speaker

```json
{
    "id": "speaker_id",
    "email": "speaker@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "expertise": [
        "JavaScript",
        "Node.js",
        "React"
    ],
    "pricePerSession": 75,
    "isVerified": true,
    "createdAt": "2025-05-03T15:27:33.352Z",
    "updatedAt": "2025-05-03T15:30:50.500Z"
}
```

### TimeSlot

```json
{
    "id": "timeslot_id",
    "speakerId": "speaker_id",
    "date": "2025-05-03T18:30:00.000Z",
    "startTime": "2025-05-03T23:00:00.000Z",
    "endTime": "2025-05-04T00:00:00.000Z",
    "isBooked": false,
    "createdAt": "2025-05-03T15:31:42.317Z",
    "updatedAt": "2025-05-03T15:31:42.317Z"
}
```

### Session

```json
{
    "id": "session_id",
    "userId": "user_id",
    "speakerId": "speaker_id",
    "timeSlotId": "timeslot_id",
    "status": "PENDING",
    "createdAt": "2025-05-03T15:33:43.786Z",
    "updatedAt": "2025-05-03T15:33:43.786Z"
}
```