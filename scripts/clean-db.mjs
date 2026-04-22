import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

// Dynamic import to handle Prisma's generated client
const { PrismaClient } = await import('../src/generated/prisma/client.ts');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

console.log('Cleaning audit logs...'); await prisma.auditLog.deleteMany();
console.log('Cleaning voting sessions...'); await prisma.votingSession.deleteMany();
console.log('Cleaning votes...'); await prisma.vote.deleteMany();
console.log('Cleaning scores...'); await prisma.score.deleteMany();
console.log('Cleaning presentations...'); await prisma.presentation.deleteMany();
console.log('Cleaning dummy users (placeholder clerk IDs)...');
await prisma.user.deleteMany({ where: { clerkId: { startsWith: 'clerk_' } } });
console.log('Keeping real Clerk users and articles.');
const users = await prisma.user.count();
const articles = await prisma.sharedArticle.count();
console.log(`Remaining: ${users} users, ${articles} articles`);
await prisma.$disconnect();
console.log('Done!');
