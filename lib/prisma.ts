import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as typeof globalThis & { prisma?: PrismaClient | null };

export const prisma: PrismaClient | null = process.env.DATABASE_URL
  ? globalForPrisma.prisma ?? new PrismaClient()
  : null;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
