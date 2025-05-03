import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    const url = process.env.DATABASE_URL;
    console.log('Attempting to connect to MongoDB...');
    
    const client = new MongoClient(url!);
    await client.connect();
    console.log('Successfully connected to MongoDB.');
    
    // Try to access the database
    const db = client.db('speaker_booking');
    await db.command({ ping: 1 });
    console.log('Database "speaker_booking" is accessible.');
    
    await client.close();
    console.log('Connection closed successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

testConnection();