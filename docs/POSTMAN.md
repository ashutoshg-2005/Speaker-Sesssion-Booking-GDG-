# Using Postman with Speaker Session Booking API

This guide explains how to use our Postman collection to test the Speaker Session Booking API.

## Prerequisites

- [Postman](https://www.postman.com/downloads/) installed on your machine
- The Speaker Session Booking API running locally (or at your deployment URL)

## Importing the Collection

1. Open Postman
2. Click on the "Import" button in the top left corner
3. Select "File" > browse to locate the `Speaker Session Booking API.postman_collection.json` file in the repository
4. Click "Import"

## Setting up Environment Variables

After importing the collection, set up an environment:

1. Click on the "Environments" tab in Postman
2. Click the "+" button to create a new environment
3. Name it "Speaker Session API"
4. Add the following variables:
   - `baseUrl`: http://localhost:3000 (or your deployment URL)
   - `userToken`: (leave empty initially - will be set automatically after login)
   - `speakerToken`: (leave empty initially - will be set automatically after login)
5. Click "Save"
6. Select your new environment from the environment dropdown in the top right corner

## Testing Flow

The collection is organized to follow the natural flow of the API:

### Authentication

1. Register a user or speaker (`Authentication > Register User` or `Authentication > Register Speaker`)
2. Verify the account with OTP (`Authentication > Verify OTP`)
3. Login as user or speaker (`Authentication > Login User` or `Authentication > Login Speaker`)
   - The login requests automatically store the returned JWT token in the environment variables

### Speaker Actions

As a speaker, you can:

1. Update your profile (`Speakers > Update Speaker Profile`)
2. Create time slots for sessions (`Speakers > Create Time Slots`)
3. View your time slots (`Speakers > Get Speaker Time Slots`)

### User Actions

As a user, you can:

1. View all speakers (`Speakers > Get All Speakers`)
2. Book a session with a speaker (`Sessions > Book Session`)
3. View your booked sessions (`Sessions > Get User Sessions`)
4. Cancel a session (`Sessions > Cancel Session`)

## Request and Response Examples

Each request in the collection includes detailed documentation with:

- A description of the endpoint
- Required request parameters and body format
- Expected response format
- Example responses

## Automatic Token Handling

The collection is configured with test scripts that automatically extract JWT tokens from login responses and store them in environment variables, allowing you to seamlessly test authenticated endpoints.

## Troubleshooting

If you encounter issues with the Postman collection:

1. Make sure your environment is properly selected
2. Verify that your API server is running
3. Check that the `baseUrl` environment variable points to the correct URL
4. For authentication issues, try logging in again to refresh your tokens