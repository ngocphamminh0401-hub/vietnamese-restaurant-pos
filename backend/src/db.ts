// Khởi tạo một instance duy nhất của PrismaClient
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;