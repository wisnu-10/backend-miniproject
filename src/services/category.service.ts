import prisma from "../config/prisma-client.config";

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
        throw new Error("Category not found");
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
        throw new Error("Category with this name already exists");
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
        throw new Error("Category not found");
    }

    // Check for duplicate name (excluding current)
    const duplicate = await prisma.eventCategory.findFirst({
        where: {
            name,
            NOT: { id },
        },
    });

    if (duplicate) {
        throw new Error("Category with this name already exists");
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
        throw new Error("Category not found");
    }

    if (category._count.events > 0) {
        throw new Error(
            "Cannot delete category that is still used by events",
        );
    }

    await prisma.eventCategory.delete({
        where: { id },
    });

    return { message: "Category deleted successfully" };
};
