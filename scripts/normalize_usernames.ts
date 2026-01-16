import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateUniqueCandidate(base: string) {
  let candidate = base.replace(/[^a-zA-Z0-9_\-\.]/g, '').toLowerCase();
  if (!candidate) candidate = 'user';

  let suffix = '';
  let attempt = 0;
  while (true) {
    const username = `${candidate}${suffix}`;
    // use findUnique by username
    const existing = await prisma.user.findUnique({ where: { username } as any });
    if (!existing) return username;
    attempt += 1;
    suffix = `_${attempt}`;
  }
}

async function main() {
  console.log('Normalizing and deduplicating usernames...');

  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, displayName: true } });

  // Map normalized -> first user id kept
  const used = new Set<string>();

  for (const u of users) {
    let normalized: string | null = null;
    if (u.username && u.username.trim()) {
      normalized = u.username.trim().toLowerCase();
    } else {
      // generate from email or displayName
      const baseFromEmail = u.email ? u.email.split('@')[0] : '';
      const baseFromDisplay = u.displayName ? u.displayName.replace(/\s+/g, '') : '';
      const base = baseFromEmail || baseFromDisplay || `user${u.id.slice(0, 8)}`;
      normalized = (await generateUniqueCandidate(base));
      // Since generateUniqueCandidate checks DB, it will return an available username.
      // Directly update and continue
      await prisma.user.update({ where: { id: u.id }, data: { username: normalized } as any });
      used.add(normalized);
      console.log(`Set missing username for ${u.id} -> ${normalized}`);
      continue;
    }

    if (!used.has(normalized)) {
      // If normalized isn't used yet, assign normalized to this user (may already match)
      // but ensure no other row already has this exact username (case-sensitive) other than this user
      const conflict = await prisma.user.findMany({ where: { username: normalized } as any, select: { id: true } });
      if (conflict.length === 0 || (conflict.length === 1 && conflict[0].id === u.id)) {
        if (u.username !== normalized) {
          await prisma.user.update({ where: { id: u.id }, data: { username: normalized } as any });
          console.log(`Normalized ${u.id}: ${u.username} -> ${normalized}`);
        }
        used.add(normalized);
        continue;
      }
    }

    // If we reached here there's a duplicate/occupied normalized username. Generate a unique available one.
    const baseCandidate = normalized.replace(/_[0-9]+$/,'');
    const unique = await generateUniqueCandidate(baseCandidate);
    await prisma.user.update({ where: { id: u.id }, data: { username: unique } as any });
    used.add(unique);
    console.log(`Resolved duplicate for ${u.id}: ${u.username} -> ${unique}`);
  }

  // Create unique index on lower(username) to enforce DB-level case-insensitive uniqueness.
  try {
    console.log('Creating unique index on lower(username)...');
    // Use CONCURRENTLY to avoid locking; note: cannot run inside a transaction. Prisma runs single statements without wrapping.
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_username_lower_idx ON "User" (lower(username));');
    console.log('Index created.');
  } catch (err) {
    console.error('Failed to create index. You may need to run the following SQL manually against your database:');
    console.error('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_username_lower_idx ON "User" (lower(username));');
    console.error(err);
  }

  console.log('Normalization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
