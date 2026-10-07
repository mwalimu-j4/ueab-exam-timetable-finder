import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('⚠️  ADMIN_EMAIL and ADMIN_PASSWORD not set, skipping admin seed');
    console.log('   Set these environment variables to create an admin user');
    return;
  }

  console.log('🌱 Seeding admin user...');

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
    },
  });

  console.log('✅ Admin user created/updated:', admin.email);
  console.log('🔒 You can now remove ADMIN_EMAIL and ADMIN_PASSWORD from environment variables');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
