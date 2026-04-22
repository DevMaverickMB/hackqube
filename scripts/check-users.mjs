import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = await import('../src/generated/prisma/client.ts');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const users = await prisma.user.findMany();
console.log('Users in DB:', users.length);
users.forEach(u => console.log(u.id, u.clerkId, u.name, u.role, u.email));
await prisma.$disconnect();
