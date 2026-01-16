import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateUniqueUsername(base: string) {
  let candidate = base.replace(/[^a-zA-Z0-9_\-\.]/g, '').toLowerCase();
  if (!candidate) candidate = 'user';

  let suffix = '';
  let attempt = 0;
  while (true) {
    const username = `${candidate}${suffix}`;
    const existing = await prisma.user.findUnique({ where: { username } as any });
    if (!existing) return username;
    attempt += 1;
    suffix = `_${attempt}`;
  }
}

async function main() {
  console.log('Backfilling missing usernames...');
  // Use raw query to find rows where username IS NULL to avoid generated types issues
  const users: Array<{ id: string; email: string | null; displayName: string | null }> = await prisma.$queryRaw`
    SELECT id, email, "displayName"
    FROM "User"
    WHERE "username" IS NULL
  ` as any;

  console.log(`Found ${users.length} users without username`);

  for (const u of users) {
    const baseFromEmail = u.email ? (u.email.split('@')[0]) : '';
    const baseFromDisplay = u.displayName ? u.displayName.replace(/\s+/g, '') : '';
    const base = baseFromEmail || baseFromDisplay || `user${u.id.slice(0,8)}`;
    const username = await generateUniqueUsername(base);

    await prisma.user.update({ where: { id: u.id } as any, data: { username } as any });
    console.log(`Assigned username ${username} to user ${u.id}`);
  }

  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });