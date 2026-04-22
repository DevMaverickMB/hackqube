import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = await import('../src/generated/prisma/client.ts');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Delete the old seed user with wrong clerkId
const deleted = await prisma.user.deleteMany({
  where: { clerkId: 'user_3CT6q8dq9j1lnpmzhPeC53T7jpY' },
});
console.log('Deleted old seed user:', deleted.count);

const remaining = await prisma.user.findMany();
console.log('Remaining users:', remaining.length);
remaining.forEach(u => console.log(u.clerkId, u.name, u.role));

await prisma.$disconnect();
