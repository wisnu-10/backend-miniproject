import prisma from "../config/prisma-client.config";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";

// Get all categories
export const getAllCategories = async () => {
    const categories = await prisma.eventCategory.findMany({
        orderBy: { name: "asc" },
    });

    return categories;
};

// Get a single category by ID
export const getCategoryById = async (id: string) => {
    const category = await prisma.eventCategory.findUnique({
        where: { id },
        include: {
            _count: {
                select: { events: true },
            },
        },
    });

    if (!category) {
        throw new NotFoundError("Category not found");
    }

    return category;
};

// Create a new category
export const createCategory = async (name: string) => {
    // Check for duplicate name
    const existing = await prisma.eventCategory.findUnique({
        where: { name },
    });

    if (existing) {
        throw new ConflictError("Category with this name already exists");
    }

    const category = await prisma.eventCategory.create({
        data: { name },
    });

    return category;
};

// Update a category
export const updateCategory = async (id: string, name: string) => {
    const existing = await prisma.eventCategory.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new NotFoundError("Category not found");
    }

    // Check for duplicate name (excluding current)
    const duplicate = await prisma.eventCategory.findFirst({
        where: {
            name,
            NOT: { id },
        },
    });

    if (duplicate) {
        throw new ConflictError("Category with this name already exists");
    }

    const category = await prisma.eventCategory.update({
        where: { id },
        data: { name },
    });

    return category;
};

// Delete a category (only if no events reference it)
export const deleteCategory = async (id: string) => {
    const category = await prisma.eventCategory.findUnique({
        where: { id },
        include: {
            _count: {
                select: { events: true },
            },
        },
    });

    if (!category) {
        throw new NotFoundError("Category not found");
    }

    if (category._count.events > 0) {
        throw new BadRequestError(
            "Cannot delete category that is still used by events",
        );
    }

    await prisma.eventCategory.delete({
        where: { id },
    });

    return { message: "Category deleted successfully" };
};
