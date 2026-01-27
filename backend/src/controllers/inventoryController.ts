// backend/src/controllers/inventoryController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET ALL ASSETS
export const getInventory = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.inventory_assets.findMany({
      include: {
        details: true,
        laboratories: true,
        units: true,
        users: true,
        workstation: true,
      },
      orderBy: {
        date_added: "desc",
      },
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

// 2. CREATE NEW ASSET
export const createAsset = async (req: Request, res: Response) => {
  try {
    const {
      item_name,
      description,
      property_tag_no,
      serial_number,
      quantity,
      lab_id,
      unit_id,
      workstation_id,
      date_of_purchase,
    } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.userId;

    // Create the asset with nested details
    const newAsset = await prisma.inventory_assets.create({
      data: {
        // Main asset record (logistics)
        lab_id: lab_id ? Number(lab_id) : null,
        unit_id: unit_id ? Number(unit_id) : null,
        workstation_id: workstation_id ? Number(workstation_id) : null,
        added_by_user_id: user_id ? Number(user_id) : null,
        
        // Nested details record
        details: {
          create: {
            item_name,
            description,
            property_tag_no,
            serial_number,
            quantity: Number(quantity) || 1,
            date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
          },
        },
      },
      include: {
        details: true,
        laboratories: true,
        units: true,
        users: true,
        workstation: true,
      },
    });
    res.json(newAsset);
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ 
      error: "Failed to create asset",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// 3. DELETE ASSET
export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    if (!assetId) {
      return res.status(400).json({ error: "Asset ID is required" });
    }

    // Check if asset exists
    const existingAsset = await prisma.inventory_assets.findUnique({
      where: { asset_id: assetId }
    });

    if (!existingAsset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Delete the asset
    await prisma.inventory_assets.delete({
      where: { asset_id: assetId }
    });

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ error: "Failed to delete asset" });
  }
};

// 4. UPDATE ASSET
export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    
    const {
      item_name,
      description,
      property_tag_no,
      serial_number,
      quantity,
      lab_id,
      unit_id,
      workstation_id,
      date_of_purchase,
    } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: "Asset ID is required" });
    }

    // Check if asset exists
    const existingAsset = await prisma.inventory_assets.findUnique({
      where: { asset_id: assetId },
      include: { details: true }
    });

    if (!existingAsset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Update both the main asset record and the details
    const updatedAsset = await prisma.inventory_assets.update({
      where: { asset_id: assetId },
      data: {
        // Update main asset record (logistics)
        lab_id: lab_id ? Number(lab_id) : null,
        unit_id: unit_id ? Number(unit_id) : null,
        workstation_id: workstation_id ? Number(workstation_id) : null,
        
        // Update nested details record
        details: existingAsset.details ? {
          update: {
            item_name,
            description,
            property_tag_no,
            serial_number,
            quantity: Number(quantity) || 1,
            date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
          },
        } : {
          create: {
            item_name,
            description,
            property_tag_no,
            serial_number,
            quantity: Number(quantity) || 1,
            date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
          },
        },
      },
      include: {
        details: true,
        laboratories: true,
        units: true,
        users: true,
        workstation: true,
      },
    });

    res.json(updatedAsset);
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ 
      error: "Failed to update asset",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
