/**
 * API Routes Module
 * 
 * This module defines all the API endpoints for the PDF to XML converter application.
 * It includes routes for authentication, file conversion, and history management.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import * as storageManager from "./storage-manager";
import multer from "multer";

// Define the SortOptions type locally
type SortOptions = {
  field: 'filename' | 'convertedAt' | 'originalSize';
  order: 'asc' | 'desc';
};

// Define the PaginationOptions type locally
type PaginationOptions = {
  page: number;
  limit: number;
};

// Define the ConversionFilters type locally
type ConversionFilters = {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
};
import * as pdfParse from "pdf-parse";
import * as xmlJs from "xml-js";
import { insertConversionSchema } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { register, login, logout, getCurrentUser, authenticate } from './auth';

// Configure multer for file uploads with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    // Accept only PDF files
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create temporary directory for file storage if needed
  const tempDir = path.join(os.tmpdir(), 'pdf-converter');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Authentication routes
  app.post('/api/register', register);
  app.post('/api/login', login);
  app.post('/api/logout', logout);
  app.get('/api/user', authenticate, getCurrentUser);

  // PDF to XML conversion API endpoint - requires authentication
  app.post('/api/convert', authenticate, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Parse the uploaded PDF
      const pdfData = await pdfParse.default(req.file.buffer);
      
      // Create XML structure
      const xmlObj = {
        _declaration: { _attributes: { version: '1.0', encoding: 'UTF-8' } },
        document: {
          _attributes: {
            filename: req.file.originalname,
            convertedAt: new Date().toISOString()
          },
          metadata: {
            title: req.file.originalname.replace('.pdf', ''),
            pages: pdfData.numpages.toString()
          },
          content: {
            page: pdfData.text.split('\n\n')
              .filter((p: string) => p.trim().length > 0)
              .map((paragraph: string, index: number) => ({
                _attributes: { number: (index + 1).toString() },
                paragraph: { _text: paragraph.trim() }
              }))
          }
        }
      };

      // Convert to XML string with formatting
      const xmlContent = xmlJs.js2xml(xmlObj, { compact: true, spaces: 2 });
      
      // Use the authenticated user's ID
      const userId = req.user._id.toString();
      
      // Store conversion in database
      const conversion = await storageManager.createConversion({
        userId,
        filename: req.file.originalname,
        originalSize: req.file.size,
        xmlContent: xmlContent
      });

      res.status(200).json({
        id: conversion._id.toString(),
        filename: conversion.filename,
        convertedAt: conversion.convertedAt,
        xmlContent: xmlContent
      });
    } catch (error: any) {
      console.error('Conversion error:', error);
      res.status(500).json({ message: error.message || 'Failed to convert PDF' });
    }
  });

  // Get conversion history API endpoint - requires authentication
  app.get('/api/conversions', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Use the authenticated user's ID
      const userId = req.user._id.toString();
      
      // Extract filter parameters from query string
      const {
        search, 
        sortBy = 'date', 
        sortOrder = 'desc',
        dateFrom,
        dateTo,
        sizeMin,
        sizeMax,
        limit = '50',
        page = '1'
      } = req.query as Record<string, string>;
      
      // Parse numeric parameters
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 50;
      const sizeMinNum = sizeMin ? parseInt(sizeMin, 10) : undefined;
      const sizeMaxNum = sizeMax ? parseInt(sizeMax, 10) : undefined;
      
      // Parse date parameters
      const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
      const dateToObj = dateTo ? new Date(dateTo) : undefined;
      
      // Build filter object
      const filters: ConversionFilters = {
        search: search || undefined,
        dateFrom: dateFromObj,
        dateTo: dateToObj,
        sizeMin: sizeMinNum,
        sizeMax: sizeMaxNum,
      };
      
      // Build sort options
      const sortOptions: SortOptions = {
        field: (sortBy === 'filename' ? 'filename' : 
               sortBy === 'size' ? 'originalSize' : 'convertedAt') as 'filename' | 'convertedAt' | 'originalSize',
        order: sortOrder === 'asc' ? 'asc' : 'desc'
      };
      
      // Get filtered conversions
      const paginationOptions: PaginationOptions = { page: pageNum, limit: limitNum };
      const conversions = await storageManager.getConversions(
        userId, 
        filters, 
        sortOptions,
        paginationOptions
      );
      
      // Get total count for pagination
      const totalCount = await storageManager.getConversionsCount(userId, filters);
      
      res.status(200).json({
        items: conversions.map(c => ({
          id: c._id.toString(),
          filename: c.filename,
          convertedAt: c.convertedAt,
          originalSize: c.originalSize
        })),
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Error fetching conversions:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch conversions' });
    }
  });

  // Get specific conversion API endpoint - requires authentication
  app.get('/api/conversions/:id', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const conversionId = req.params.id;
      
      const conversion = await storageManager.getConversion(conversionId);
      if (!conversion) {
        return res.status(404).json({ message: 'Conversion not found' });
      }
      
      // Check if the conversion belongs to the current user
      if (conversion.userId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You do not have permission to access this conversion' });
      }
      
      res.status(200).json({
        id: conversion._id.toString(),
        filename: conversion.filename,
        convertedAt: conversion.convertedAt,
        xmlContent: conversion.xmlContent
      });
    } catch (error: any) {
      console.error('Error fetching conversion:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch conversion' });
    }
  });

  // Delete conversion API endpoint - requires authentication
  app.delete('/api/conversions/:id', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const conversionId = req.params.id;
      
      const conversion = await storageManager.getConversion(conversionId);
      if (!conversion) {
        return res.status(404).json({ message: 'Conversion not found' });
      }
      
      // Check if the conversion belongs to the current user
      if (conversion.userId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You do not have permission to delete this conversion' });
      }
      
      const deleted = await storageManager.deleteConversion(conversionId);
      if (deleted) {
        res.status(200).json({ message: 'Conversion deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete conversion' });
      }
    } catch (error: any) {
      console.error('Error deleting conversion:', error);
      res.status(500).json({ message: error.message || 'Failed to delete conversion' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
