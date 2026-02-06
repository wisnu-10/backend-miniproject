"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const auth_services_1 = require("../services/auth.services");
const client_1 = require("../generated/prisma/client");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, full_name, role, referral_code, phone_number } = req.body;
        if (!email || !password || !full_name || !role) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        if (!Object.values(client_1.UserRole).includes(role)) {
            res.status(400).json({ message: "Invalid role" });
            return;
        }
        const user = yield (0, auth_services_1.register)({
            email,
            password,
            full_name,
            phone_number,
            role,
            referral_code,
        });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                referral_code: user.referral_code,
            },
        });
    }
    catch (error) {
        // Handle specific errors like "User already exists" or "Invalid referral code"
        if (error.message === "User already exists" ||
            error.message === "Invalid referral code") {
            res.status(400).json({ message: error.message });
            return;
        }
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        const { user, token } = yield (0, auth_services_1.login)({ email, password });
        // Set HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Set to true in production
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: "strict",
        });
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
            token, // Optional: send token in body if needed for non-browser clients
        });
    }
    catch (error) {
        if (error.message === "Invalid email or password") {
            res.status(401).json({ message: error.message });
            return;
        }
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
});
exports.logout = logout;
