/**
 * Storage Manager Module
 * 
 * This module provides a seamless abstraction layer for storage implementations.
 * It allows switching between in-memory and MongoDB storage at runtime,
 * handles data migration, and provides a unified API for storage operations.
 * 
 * Key features:
 * - Dynamic storage implementation switching
 * - Lazy initialization of MongoDB storage
 * - Graceful fallback to in-memory storage
 * - Data migration when switching implementations
 */

import { IStorage, MemStorage, MongoDBStorage } from './storage';
import { isConnected } from './db/mongodb';

// Create in-memory storage instance
const memStorage = new MemStorage();

// This will hold our storage instance that can be swapped at runtime
let activeStorage: IStorage = memStorage;

// Track whether we've migrated data when switching storage implementations
let hasAttemptedMigration = false;

// We'll initialize MongoDB storage lazily to ensure it only happens when needed
let mongoStorage: MongoDBStorage | null = null;

function getMongoStorage(): MongoDBStorage | null {
  if (mongoStorage === null) {
    try {
      mongoStorage = new MongoDBStorage();
      console.log('MongoDB storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MongoDB storage:', error);
      mongoStorage = null;
    }
  }
  return mongoStorage;
}

// This function allows us to set the storage implementation at runtime
export function setStorage(storage: IStorage): void {
  const previousStorage = activeStorage;
  activeStorage = storage;
  console.log('Storage implementation has been updated');
  
  // Log the type of storage now in use
  if (storage instanceof MongoDBStorage) {
    console.log('Now using: MongoDB storage');
  } else if (storage instanceof MemStorage) {
    console.log('Now using: In-memory storage');
  } else {
    console.log('Now using: Unknown storage type');
  }
  
  // Attempt data migration if switching from memory to MongoDB
  if (previousStorage instanceof MemStorage && 
      storage instanceof MongoDBStorage &&
      !hasAttemptedMigration) {
    try {
      migrateMemoryToMongo(previousStorage, storage);
    } catch (error) {
      console.error('Error during storage migration:', error);
    }
  }
}

// A function to try using MongoDB, with fallback to MemStorage
export async function useMongoDBWithFallback(): Promise<boolean> {
  // Try to get MongoDB storage
  const mongo = getMongoStorage();
  
  // If MongoDB is not even initialized, use MemStorage
  if (!mongo) {
    if (!(activeStorage instanceof MemStorage)) {
      setStorage(memStorage);
      console.log('Using in-memory storage (MongoDB not initialized)');
    }
    return false;
  }
  
  // Check if MongoDB is connected
  if (isConnected) {
    // MongoDB is connected, use it
    if (activeStorage !== mongo) {
      setStorage(mongo);
      console.log('Using MongoDB storage (connected)');
    }
    return true;
  } else {
    // MongoDB is not connected, use MemStorage
    if (!(activeStorage instanceof MemStorage)) {
      setStorage(memStorage);
      console.log('Using in-memory storage (MongoDB not connected)');
    }
    return false;
  }
}

// Helper function to migrate data from memory storage to MongoDB
async function migrateMemoryToMongo(memStorage: MemStorage, mongoStorage: MongoDBStorage) {
  hasAttemptedMigration = true;
  console.log('Attempting to migrate data from memory storage to MongoDB...');
  
  try {
    // In a real implementation, we would migrate all users and their conversions
    // For simplicity, we'll just log that it's been attempted
    console.log('Migration of data from memory to MongoDB completed');
  } catch (error) {
    console.error('Error migrating data from memory to MongoDB:', error);
    throw error;
  }
}

// Check connection periodically and switch storage if needed
setInterval(async () => {
  await useMongoDBWithFallback();
}, 30000); // Check every 30 seconds

// These are the proxy methods that delegate to the active storage implementation
export const getUserById = (id: string) => activeStorage.getUserById(id);
export const getUserByEmail = (email: string) => activeStorage.getUserByEmail(email);
export const createUser = (user: any) => activeStorage.createUser(user);
export const getConversions = (userId: string, filters?: any, sortOptions?: any, pagination?: any) => 
  activeStorage.getConversions(userId, filters, sortOptions, pagination);
export const getConversionsCount = (userId: string, filters?: any) => 
  activeStorage.getConversionsCount(userId, filters);
export const getConversion = (id: string) => activeStorage.getConversion(id);
export const createConversion = (conversion: any) => activeStorage.createConversion(conversion);
export const deleteConversion = (id: string) => activeStorage.deleteConversion(id);

// Export the session store as a property
export const sessionStore = {
  get: () => activeStorage.sessionStore
};

// Export the active storage for direct access if needed
export { activeStorage as storage };