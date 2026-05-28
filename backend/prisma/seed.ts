import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agricsec.com' },
    update: {},
    create: {
      email: 'admin@agricsec.com',
      passwordHash: adminHash,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // Demo farmer
  const farmerHash = await bcrypt.hash('Farmer@1234', 12);
  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@agricsec.com' },
    update: {},
    create: {
      email: 'farmer@agricsec.com',
      passwordHash: farmerHash,
      firstName: 'Demo',
      lastName: 'Farmer',
      role: Role.FARMER,
      isVerified: true,
    },
  });

  // Demo farm
  const farm = await prisma.farm.upsert({
    where: { id: 'seed-farm-001' },
    update: {},
    create: {
      id: 'seed-farm-001',
      name: 'Green Valley Farm',
      description: 'Demo farm for testing',
      latitude: 6.5244,
      longitude: 3.3792,
      areaHectares: 12.5,
      country: 'NG',
      region: 'Lagos',
      soilType: 'Loamy',
      ownerId: farmer.id,
    },
  });

  // Seed market prices
  const commodities = [
    { commodity: 'maize', market: 'Lagos Commodity Exchange', country: 'NG', pricePerKg: 0.45 },
    { commodity: 'rice', market: 'Lagos Commodity Exchange', country: 'NG', pricePerKg: 0.85 },
    { commodity: 'cassava', market: 'Ibadan Market', country: 'NG', pricePerKg: 0.22 },
    { commodity: 'wheat', market: 'Kano Market', country: 'NG', pricePerKg: 0.62 },
  ];

  for (const c of commodities) {
    await prisma.marketPrice.upsert({
      where: { commodity_market_recordedAt: { ...c, recordedAt: new Date('2024-01-01') } },
      update: {},
      create: { ...c, currency: 'USD', recordedAt: new Date('2024-01-01'), source: 'seed' },
    });
  }

  console.log(`Seeded: admin(${admin.email}), farmer(${farmer.email}), farm(${farm.name})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
