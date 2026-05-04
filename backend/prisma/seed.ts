import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Check if data already exists
  const existingStaff = await prisma.staff.count();
  if (existingStaff > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  // Seed initial staff
  await prisma.staff.createMany({
    data: [
      {
        code: 'NV001',
        name: 'Nguyễn Văn A',
        phone: '0901234567',
        role: 'MANAGER',
        department: 'Quản lý',
        cccd: '001234567890',
        gender: 'MALE',
        startDate: new Date('2023-01-01'),
        address: 'Hà Nội',
        status: 'ACTIVE'
      },
      {
        code: 'NV002',
        name: 'Trần Thị B',
        phone: '0902345678',
        role: 'WAITER',
        department: 'Bàn',
        cccd: '002345678901',
        gender: 'FEMALE',
        startDate: new Date('2023-03-15'),
        address: 'Hồ Chí Minh',
        status: 'ACTIVE'
      }
    ]
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
