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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const prisma_client_config_1 = __importDefault(require("../config/prisma-client.config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const referral_1 = require("../utils/referral");
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const register = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, full_name, phone_number, role, referral_code } = data;
    // Check if user exists
    const existingUser = yield prisma_client_config_1.default.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new Error("User already exists");
    }
    // Validate referral code if provided
    let referredByUserId = null;
    if (referral_code) {
        const referrer = yield prisma_client_config_1.default.user.findUnique({
            where: { referral_code },
        });
        if (!referrer) {
            throw new Error("Invalid referral code");
        }
        referredByUserId = referrer.id;
    }
    // Hash password
    const hashedPassword = yield bcrypt_1.default.hash(password, SALT_ROUNDS);
    // Generate unique referral code for new user
    let newReferralCode = (0, referral_1.generateReferralCode)();
    let isUnique = false;
    while (!isUnique) {
        const existing = yield prisma_client_config_1.default.user.findUnique({
            where: { referral_code: newReferralCode },
        });
        if (!existing) {
            isUnique = true;
        }
        else {
            newReferralCode = (0, referral_1.generateReferralCode)();
        }
    }
    // Create user
    const newUser = yield prisma_client_config_1.default.user.create({
        data: {
            email,
            password: hashedPassword,
            full_name,
            phone_number,
            role,
            referral_code: newReferralCode,
            referred_by: referredByUserId,
        },
    });
    return newUser;
});
exports.register = register;
const login = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = data;
    const user = yield prisma_client_config_1.default.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }
    // Generate Token
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    return { user, token };
});
exports.login = login;
