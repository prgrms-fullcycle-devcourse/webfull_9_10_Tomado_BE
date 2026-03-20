import { prisma } from './prisma.js';

export async function listExamples() {
    return prisma.example.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
}
