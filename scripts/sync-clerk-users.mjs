import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = await import('../src/generated/prisma/client.ts');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Fetch from Clerk
const res = await fetch('https://api.clerk.com/v1/users?limit=10', {
  headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
});
const clerkUsers = await res.json();
console.log(`Found ${clerkUsers.length} Clerk users`);

for (const cu of clerkUsers) {
  const email = cu.email_addresses?.[0]?.email_address || '';
  const name = [cu.first_name, cu.last_name].filter(Boolean).join(' ') || email || 'User';
  const role = cu.public_metadata?.role === 'admin' ? 'admin' : 'participant';

  console.log(`Syncing: ${cu.id} ${name} (${email}) role=${role}`);

  await prisma.user.upsert({
    where: { clerkId: cu.id },
    update: { name, email, avatarUrl: cu.image_url },
    create: {
      clerkId: cu.id,
      name,
      email,
      role,
      avatarUrl: cu.image_url,
    },
  });
}

const users = await prisma.user.findMany();
console.log(`\nDB now has ${users.length} users:`);
users.forEach(u => console.log(u.id, u.clerkId, u.name, u.role, u.email));

await prisma.$disconnect();
