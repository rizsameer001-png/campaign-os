import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // --- Super admin ---
  const superAdminPassword = await bcrypt.hash(process.env.SEED_SUPER_ADMIN_PASSWORD || 'ChangeMe!123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@election-os.local' },
    update: {},
    create: {
      name: 'Platform Super Admin',
      email: 'superadmin@election-os.local',
      phone: '+910000000000',
      passwordHash: superAdminPassword,
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log(`Seeded super admin: ${superAdmin.email}`);

  // --- Sample constituencies (for demo/dev) ---
  const constituencies = [
    { name: 'Chandni Chowk', state: 'Delhi', population: 1500000, genderRatio: 868, literacyRate: 82.9, urbanPercent: 100 },
    { name: 'Anand Vihar', state: 'Delhi', population: 250000, genderRatio: 880, literacyRate: 85.2, urbanPercent: 100 },
    { name: 'Baramati', state: 'Maharashtra', population: 1800000, genderRatio: 921, literacyRate: 78.4, urbanPercent: 42 },
  ];

  for (const c of constituencies) {
    await prisma.constituency.upsert({
      where: { name_state: { name: c.name, state: c.state } },
      update: {},
      create: c,
    });
  }
  console.log(`Seeded ${constituencies.length} sample constituencies`);

  // --- Service catalog (SPI-S-001) ---
  const services = [
    { title: 'Campaign Strategy', category: 'Campaign Strategy', slug: 'campaign-strategy', description: 'End-to-end campaign strategy design.', features: ['Readiness assessment', 'Weekly planning', 'Budget allocation'] },
    { title: 'Digital Campaigning', category: 'Digital Campaigning', slug: 'digital-campaigning', description: 'AI-assisted social media and digital outreach.', features: ['Social post generation', 'Multi-language support', 'A/B variants'] },
    { title: 'Ground Operations', category: 'Ground Operations', slug: 'ground-operations', description: 'Volunteer and booth management at scale.', features: ['Task assignment', 'Booth coverage tracking', 'Attendance'] },
    { title: 'Political Intelligence', category: 'Political Intelligence', slug: 'political-intelligence', description: 'Constituency and opposition intelligence.', features: ['Demographic analysis', 'Opposition tracking', 'Sentiment scoring'] },
  ];

  for (const s of services) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
  console.log(`Seeded ${services.length} services`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
