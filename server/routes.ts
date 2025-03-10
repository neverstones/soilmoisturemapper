import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { soilMoistureQuerySchema } from "@shared/schema";
import { calculateSoilMoistureIndex } from "./earthEngine";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to fetch soil moisture data
  app.get('/api/soil-moisture', async (req: Request, res: Response) => {
    try {
      // Parse and validate the query parameters
      const validatedQuery = soilMoistureQuerySchema.parse({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        timeStep: req.query.timeStep,
        region: req.query.region
      });

      // Calculate soil moisture index from Google Earth Engine
      const soilMoistureData = await calculateSoilMoistureIndex(
        validatedQuery.startDate,
        validatedQuery.endDate,
        validatedQuery.timeStep,
        validatedQuery.region
      );

      res.json(soilMoistureData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid request parameters',
          errors: error.errors
        });
      }
      
      console.error("Error fetching soil moisture data:", error);
      res.status(500).json({
        message: "Failed to fetch soil moisture data"
      });
    }
  });

  // API endpoint to get available regions
  app.get('/api/regions', async (_req: Request, res: Response) => {
    try {
      // In a real application, this would fetch regions from a database
      // For now, return some predefined regions
      const regions = [
        { id: 'region1', name: 'North Region' },
        { id: 'region2', name: 'Central Plains' },
        { id: 'region3', name: 'Eastern Basin' },
        { id: 'region4', name: 'Southern Valley' },
        { id: 'region5', name: 'Western Hills' },
      ];
      
      res.json(regions);
    } catch (error) {
      console.error("Error fetching regions:", error);
      res.status(500).json({ 
        message: "Failed to fetch regions" 
      });
    }
  });

  // API endpoint to run custom analysis
  app.post('/api/analysis', async (req: Request, res: Response) => {
    try {
      const { type, region, startDate, endDate } = req.body;
      
      // Validate request body
      if (!type || !region || !startDate || !endDate) {
        return res.status(400).json({
          message: 'Missing required parameters'
        });
      }
      
      // In a real application, this would run a specific analysis
      // For now, return some mock data
      const analysisResult = {
        type,
        region,
        startDate,
        endDate,
        result: {
          mean: 0.35 + Math.random() * 0.2,
          min: 0.2 + Math.random() * 0.1,
          max: 0.4 + Math.random() * 0.2,
        }
      };
      
      res.json(analysisResult);
    } catch (error) {
      console.error("Error running analysis:", error);
      res.status(500).json({
        message: "Failed to run analysis"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
