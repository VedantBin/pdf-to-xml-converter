/**
 * MongoDB Database Connection Module
 * 
 * This module handles the connection to MongoDB using Mongoose.
 * It includes connection establishment, retry logic, and status monitoring.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get MongoDB connection URI from environment variables
const uri = process.env.MONGODB_URI;

// Debug logging for environment variables
console.log('Environment variables loaded:', {
  hasMongoUri: !!uri,
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  mongoUriLength: uri?.length
});

// Try to mask the URI for safe logging
let maskedUri = 'No URI provided';
if (uri) {
  try {
    maskedUri = uri.replace(/mongodb(\+srv)?:\/\/([^:]+):[^@]+@/, 'mongodb$1://***:***@');
    console.log('MongoDB URI format (masked):', maskedUri);
  } catch (error) {
    console.warn('Could not mask MongoDB URI:', error);
  }
}

// Validate the URI format
if (uri) {
  if (!uri.includes('mongodb')) {
    console.warn('MongoDB URI does not contain "mongodb" string');
  }
}

// Module-level variables for connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// Connection function with retry logic
export async function connectToDatabase(): Promise<mongoose.Connection | null> {
  // If we're already connected, return the connection
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    console.log('MongoDB already connected, reusing connection');
    return mongoose.connection;
  }
  
  // If we've reached the maximum number of connection attempts, give up
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.warn(`MongoDB connection failed after ${MAX_CONNECTION_ATTEMPTS} attempts`);
    return null;
  }
  
  // If we don't have a URI, we can't connect
  if (!uri) {
    console.warn('No MongoDB URI provided in environment variables');
    return null;
  }
  
  try {
    connectionAttempts++;
    console.log(`Attempting to connect to MongoDB (Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);
    
    // Configure mongoose options
    mongoose.set('strictQuery', true);
    
    // Connect with a timeout
    const connection = await Promise.race([
      mongoose.connect(uri, {
        // Performance settings
        connectTimeoutMS: 30000,      // Connection timeout (30 seconds)
        socketTimeoutMS: 45000,       // Socket timeout (45 seconds)
        serverSelectionTimeoutMS: 30000, // Timeout for server selection
        // Reliability settings
        retryWrites: true,
        retryReads: true,
        // Additional options
        maxPoolSize: 10,
        minPoolSize: 5,
        heartbeatFrequencyMS: 10000,
        // Authentication
        authSource: 'admin',
        // TLS/SSL
        ssl: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30000ms')), 30000);
      })
    ]);
    
    // Successfully connected
    isConnected = true;
    console.log('Connected to MongoDB successfully using Mongoose');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    console.log('MongoDB host:', mongoose.connection.host);
    console.log('MongoDB database:', mongoose.connection.db?.databaseName ?? 'unknown');
    
    // Reset connection attempts on success
    connectionAttempts = 0;
    
    // Add event listeners for connection status
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error(`MongoDB connection error (Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}):`, error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // If we've hit the max attempts, don't try again
    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.error('Maximum MongoDB connection attempts reached. Falling back to in-memory storage.');
      return null;
    }
    
    return null;
  }
}

// Helper function to check if MongoDB is connected
export function isMongoConnected(): boolean {
  const state = mongoose.connection.readyState;
  console.log('Current MongoDB connection state:', state);
  return state === 1;
}

// Helper function to get a collection
export async function getCollection(collectionName: string) {
  try {
    await connectToDatabase();
    if (!isMongoConnected()) {
      console.warn(`Cannot get collection ${collectionName}: MongoDB not connected`);
      return null;
    }
    
    // This is a compatibility layer to work with existing code that expects a MongoDB collection
    const collection = mongoose.connection.collection(collectionName);
    console.log(`Successfully accessed collection: ${collectionName}`);
    return collection;
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return null;
  }
}

// Periodically check connection and try to reconnect if needed
setInterval(async () => {
  if (!isMongoConnected() && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
    console.log('Checking MongoDB connection status...');
    await connectToDatabase();
  }
}, 30000); // Check every 30 seconds

// Export connection-related variables
export { isConnected };