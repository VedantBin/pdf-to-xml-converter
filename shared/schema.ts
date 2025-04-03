import { z } from "zod";
import { ObjectId } from 'mongodb';

// User schema for MongoDB
export const userSchema = z.object({
  _id: z.any().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  createdAt: z.date().optional(),
});

export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Conversion schema for MongoDB
export const conversionSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  filename: z.string(),
  originalSize: z.number(),
  xmlContent: z.string(),
  convertedAt: z.date().optional(),
});

export const insertConversionSchema = conversionSchema.omit({ _id: true, convertedAt: true });

export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = z.infer<typeof conversionSchema>;

// Schema for authentication
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
