"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
require("dotenv/config");
const DATABASE_URL = process.env.DATABASE_URL;
const adapter = new adapter_pg_1.PrismaPg({ connectionString: DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
