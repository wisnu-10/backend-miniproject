import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as categoryService from "../services/category.service";
import { getParamAsString } from "../utils/params";

// Get all categories (public)
export const getAllCategories = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try {
        const categories = await categoryService.getAllCategories();

        res.status(200).json({
            data: categories,
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get a single category by ID (public)
export const getCategoryById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const category = await categoryService.getCategoryById(getParamAsString(req.params.id));

        res.status(200).json({
            data: category,
        });
    } catch (error: any) {
        if (error.message === "Category not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Create a new category (ORGANIZER only)
export const createCategory = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { name } = req.body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            res.status(400).json({ message: "Category name is required" });
            return;
        }

        const category = await categoryService.createCategory(name.trim());

        res.status(201).json({
            message: "Category created successfully",
            data: category,
        });
    } catch (error: any) {
        if (error.message.includes("already exists")) {
            res.status(409).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Update a category (ORGANIZER only)
export const updateCategory = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { name } = req.body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            res.status(400).json({ message: "Category name is required" });
            return;
        }

        const category = await categoryService.updateCategory(
            getParamAsString(req.params.id),
            name.trim(),
        );

        res.status(200).json({
            message: "Category updated successfully",
            data: category,
        });
    } catch (error: any) {
        if (error.message === "Category not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error.message.includes("already exists")) {
            res.status(409).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Delete a category (ORGANIZER only)
export const deleteCategory = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const result = await categoryService.deleteCategory(getParamAsString(req.params.id));

        res.status(200).json(result);
    } catch (error: any) {
        if (error.message === "Category not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error.message.includes("still used")) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
