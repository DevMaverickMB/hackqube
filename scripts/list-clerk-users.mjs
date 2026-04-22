import 'dotenv/config';

const res = await fetch('https://api.clerk.com/v1/users?limit=5', {
  headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
});
console.log('Clerk API Status:', res.status);
const users = await res.json();
if (Array.isArray(users)) {
  users.forEach(u => console.log(u.id, u.first_name, u.last_name, u.email_addresses?.[0]?.email_address, JSON.stringify(u.public_metadata)));
} else {
  console.log('Response:', JSON.stringify(users, null, 2));
}
