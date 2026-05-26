import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as categoryService from "../services/category.service";
import { getParamAsString } from "../utils/params";
import { BadRequestError } from "../utils/errors";

// Get all categories (public)
export const getAllCategories = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    const categories = await categoryService.getAllCategories();

    res.status(200).json({
        data: categories,
    });
};

// Get a single category by ID (public)
export const getCategoryById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const category = await categoryService.getCategoryById(getParamAsString(req.params.id));

    res.status(200).json({
        data: category,
    });
};

// Create a new category (ORGANIZER only)
export const createCategory = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        throw new BadRequestError("Category name is required");
    }

    const category = await categoryService.createCategory(name.trim());

    res.status(201).json({
        message: "Category created successfully",
        data: category,
    });
};

// Update a category (ORGANIZER only)
export const updateCategory = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        throw new BadRequestError("Category name is required");
    }

    const category = await categoryService.updateCategory(
        getParamAsString(req.params.id),
        name.trim(),
    );

    res.status(200).json({
        message: "Category updated successfully",
        data: category,
    });
};

// Delete a category (ORGANIZER only)
export const deleteCategory = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const result = await categoryService.deleteCategory(getParamAsString(req.params.id));

    res.status(200).json(result);
};
