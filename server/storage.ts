import { type User, type InsertUser, type Conversion, type InsertConversion } from "@shared/schema";
import { getCollection, isConnected } from "./db/mongodb";
import { ObjectId } from "mongodb";
import session from "express-session";
import createMemoryStore from "memorystore";

// modify the interface with any CRUD methods
// you might need

// Define filter interface
export interface ConversionFilters {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
}

// Define sort options interface
export interface SortOptions {
  field: 'filename' | 'convertedAt' | 'originalSize';
  order: 'asc' | 'desc';
}

// Define pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversion methods
  getConversions(
    userId: string, 
    filters?: ConversionFilters,
    sortOptions?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<Conversion[]>;
  
  getConversionsCount(userId: string, filters?: ConversionFilters): Promise<number>;
  getConversion(id: string): Promise<Conversion | undefined>;
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  deleteConversion(id: string): Promise<boolean>;
  
  // For session storage
  sessionStore: session.Store;
}

// Create a memory store for sessions
const MemoryStore = createMemoryStore(session);

// In-memory fallback storage
export class MemStorage implements IStorage {
  private users: User[] = [];
  private conversions: Conversion[] = [];
  private userId = 1;
  private conversionId = 1;
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    console.log('Using in-memory storage');
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.find(user => user._id.toString() === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = new ObjectId(this.userId++);
    const user = {
      _id: id,
      ...insertUser,
      createdAt: new Date()
    } as User;
    this.users.push(user);
    return user;
  }
  
  async getConversions(
    userId: string,
    filters?: ConversionFilters,
    sortOptions?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<Conversion[]> {
    // Filter by userId first (required filter)
    let filtered = this.conversions.filter(conv => conv.userId === userId);
    
    // Apply additional filters if provided
    if (filters) {
      // Text search on filename
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(conv => 
          conv.filename.toLowerCase().includes(searchLower)
        );
      }
      
      // Date range filters
      if (filters.dateFrom) {
        filtered = filtered.filter(conv => {
          const convDate = conv.convertedAt ? new Date(conv.convertedAt) : new Date();
          return convDate >= filters.dateFrom!;
        });
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(conv => {
          const convDate = conv.convertedAt ? new Date(conv.convertedAt) : new Date();
          return convDate <= filters.dateTo!;
        });
      }
      
      // Size range filters
      if (filters.sizeMin !== undefined) {
        filtered = filtered.filter(conv => conv.originalSize >= filters.sizeMin!);
      }
      
      if (filters.sizeMax !== undefined) {
        filtered = filtered.filter(conv => conv.originalSize <= filters.sizeMax!);
      }
    }
    
    // Apply sorting
    const field = sortOptions?.field || 'convertedAt';
    const order = sortOptions?.order || 'desc';
    
    filtered.sort((a, b) => {
      let valA, valB;
      
      if (field === 'filename') {
        valA = a.filename.toLowerCase();
        valB = b.filename.toLowerCase();
      } else if (field === 'originalSize') {
        valA = a.originalSize;
        valB = b.originalSize;
      } else {
        // Default to sort by date
        valA = a.convertedAt ? a.convertedAt.getTime() : Date.now();
        valB = b.convertedAt ? b.convertedAt.getTime() : Date.now();
      }
      
      if (order === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
    
    // Apply pagination
    if (pagination) {
      const { page, limit } = pagination;
      const startIndex = (page - 1) * limit;
      filtered = filtered.slice(startIndex, startIndex + limit);
    }
    
    return filtered;
  }
  
  async getConversionsCount(userId: string, filters?: ConversionFilters): Promise<number> {
    // Reuse filtering logic from getConversions but return count instead
    let filtered = this.conversions.filter(conv => conv.userId === userId);
    
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(conv => 
          conv.filename.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.dateFrom) {
        filtered = filtered.filter(conv => {
          const convDate = conv.convertedAt ? new Date(conv.convertedAt) : new Date();
          return convDate >= filters.dateFrom!;
        });
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(conv => {
          const convDate = conv.convertedAt ? new Date(conv.convertedAt) : new Date();
          return convDate <= filters.dateTo!;
        });
      }
      
      if (filters.sizeMin !== undefined) {
        filtered = filtered.filter(conv => conv.originalSize >= filters.sizeMin!);
      }
      
      if (filters.sizeMax !== undefined) {
        filtered = filtered.filter(conv => conv.originalSize <= filters.sizeMax!);
      }
    }
    
    return filtered.length;
  }
  
  async getConversion(id: string): Promise<Conversion | undefined> {
    return this.conversions.find(conv => conv._id.toString() === id);
  }
  
  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const id = new ObjectId(this.conversionId++);
    const conversion = {
      _id: id,
      ...insertConversion,
      convertedAt: new Date()
    } as Conversion;
    this.conversions.push(conversion);
    return conversion;
  }
  
  async deleteConversion(id: string): Promise<boolean> {
    const initialLength = this.conversions.length;
    this.conversions = this.conversions.filter(conv => conv._id.toString() !== id);
    return this.conversions.length < initialLength;
  }
}

export class MongoDBStorage implements IStorage {
  sessionStore: session.Store;
  private connectionOK: boolean = false;
  
  constructor() {
    // For now we're using MemoryStore for sessions even with MongoDB
    // In a production app, you might use connect-mongodb-session instead
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    console.log('MongoDB storage initialized');
    
    // Check connection on startup and periodically
    this.checkConnection();
    
    // Set up a periodic connection check every minute
    setInterval(() => this.checkConnection(), 60000);
  }
  
  private async checkConnection(): Promise<boolean> {
    try {
      // Attempt to get a collection to test the connection
      const usersCollection = await getCollection('users');
      if (!usersCollection) {
        if (this.connectionOK) {
          console.warn('MongoDB connection lost');
          this.connectionOK = false;
        }
        return false;
      }
      
      // Try a simple query to verify connection is fully working
      await usersCollection.countDocuments({}, { limit: 1 });
      
      // Connection is good
      if (!this.connectionOK) {
        console.log('MongoDB connection established successfully');
        this.connectionOK = true;
      }
      return true;
    } catch (error) {
      if (this.connectionOK) {
        console.error('MongoDB connection error:', error);
        this.connectionOK = false;
      }
      return false;
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const usersCollection = await getCollection('users');
      if (!usersCollection) return undefined;
      
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      return user as User | undefined;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const usersCollection = await getCollection('users');
      if (!usersCollection) return undefined;
      
      const user = await usersCollection.findOne({ email });
      return user as User | undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const usersCollection = await getCollection('users');
      if (!usersCollection) throw new Error('MongoDB collection not available');
      
      const userWithDate = {
        ...insertUser,
        createdAt: new Date()
      };
      
      const result = await usersCollection.insertOne(userWithDate);
      return {
        _id: result.insertedId,
        ...userWithDate
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async getConversions(
    userId: string, 
    filters?: ConversionFilters,
    sortOptions?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<Conversion[]> {
    try {
      const conversionsCollection = await getCollection('conversions');
      if (!conversionsCollection) return [];
      
      // Start with the base query filter
      const query: any = { userId };
      
      // Apply additional filters
      if (filters) {
        // Text search
        if (filters.search) {
          query.filename = { $regex: filters.search, $options: 'i' }; // case-insensitive search
        }
        
        // Date range filters
        if (filters.dateFrom || filters.dateTo) {
          query.convertedAt = {};
          
          if (filters.dateFrom) {
            query.convertedAt.$gte = filters.dateFrom;
          }
          
          if (filters.dateTo) {
            query.convertedAt.$lte = filters.dateTo;
          }
        }
        
        // Size range filters
        if (filters.sizeMin !== undefined || filters.sizeMax !== undefined) {
          query.originalSize = {};
          
          if (filters.sizeMin !== undefined) {
            query.originalSize.$gte = filters.sizeMin;
          }
          
          if (filters.sizeMax !== undefined) {
            query.originalSize.$lte = filters.sizeMax;
          }
        }
      }
      
      // Determine sort options
      const sortField = sortOptions?.field || 'convertedAt';
      const sortOrder = sortOptions?.order === 'asc' ? 1 : -1;
      const sortQuery: any = {};
      sortQuery[sortField] = sortOrder;
      
      // Create the base query
      let dbQuery = conversionsCollection
        .find(query)
        .sort(sortQuery);
      
      // Apply pagination if provided
      if (pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        dbQuery = dbQuery.skip(skip).limit(limit);
      }
      
      // Execute the query
      const conversions = await dbQuery.toArray();
      
      return conversions as Conversion[];
    } catch (error) {
      console.error('Error getting conversions:', error);
      return [];
    }
  }
  
  async getConversionsCount(userId: string, filters?: ConversionFilters): Promise<number> {
    try {
      const conversionsCollection = await getCollection('conversions');
      if (!conversionsCollection) return 0;
      
      // Start with the base query filter
      const query: any = { userId };
      
      // Apply additional filters (same as in getConversions)
      if (filters) {
        // Text search
        if (filters.search) {
          query.filename = { $regex: filters.search, $options: 'i' };
        }
        
        // Date range filters
        if (filters.dateFrom || filters.dateTo) {
          query.convertedAt = {};
          
          if (filters.dateFrom) {
            query.convertedAt.$gte = filters.dateFrom;
          }
          
          if (filters.dateTo) {
            query.convertedAt.$lte = filters.dateTo;
          }
        }
        
        // Size range filters
        if (filters.sizeMin !== undefined || filters.sizeMax !== undefined) {
          query.originalSize = {};
          
          if (filters.sizeMin !== undefined) {
            query.originalSize.$gte = filters.sizeMin;
          }
          
          if (filters.sizeMax !== undefined) {
            query.originalSize.$lte = filters.sizeMax;
          }
        }
      }
      
      // Count the documents
      return await conversionsCollection.countDocuments(query);
    } catch (error) {
      console.error('Error counting conversions:', error);
      return 0;
    }
  }
  
  async getConversion(id: string): Promise<Conversion | undefined> {
    try {
      const conversionsCollection = await getCollection('conversions');
      if (!conversionsCollection) return undefined;
      
      const conversion = await conversionsCollection.findOne({ _id: new ObjectId(id) });
      return conversion as Conversion | undefined;
    } catch (error) {
      console.error('Error getting conversion:', error);
      return undefined;
    }
  }
  
  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    try {
      const conversionsCollection = await getCollection('conversions');
      if (!conversionsCollection) throw new Error('MongoDB collection not available');
      
      const conversionWithDate = {
        ...insertConversion,
        convertedAt: new Date()
      };
      
      const result = await conversionsCollection.insertOne(conversionWithDate);
      return {
        _id: result.insertedId,
        ...conversionWithDate
      } as Conversion;
    } catch (error) {
      console.error('Error creating conversion:', error);
      throw error;
    }
  }
  
  async deleteConversion(id: string): Promise<boolean> {
    try {
      const conversionsCollection = await getCollection('conversions');
      if (!conversionsCollection) return false;
      
      const result = await conversionsCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting conversion:', error);
      return false;
    }
  }
}

// Initialize with MemStorage as default and export classes
// The actual storage instance will be managed by storage-manager.ts
const memStorage = new MemStorage();
export const storage = memStorage;
