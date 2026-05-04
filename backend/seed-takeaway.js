const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTakeawayTable() {
  try {
    console.log('🔄 Creating Takeaway table...');
    
    // Check if table 901 already exists
    const existing = await prisma.table.findUnique({
      where: { id: 901 }
    });
    
    if (existing) {
      console.log('ℹ️  Takeaway table already exists, updating...');
      await prisma.table.update({
        where: { id: 901 },
        data: {
          name: 'Mang về',
          status: 'AVAILABLE',
          areaId: '550e8400-e29b-41d4-a716-446655440004',
          capacity: 0,
          isActive: true,
          sortOrder: 0
        }
      });
    } else {
      console.log('📝 Creating new Takeaway table...');
      await prisma.table.create({
        data: {
          id: 901,
          name: 'Mang về',
          status: 'AVAILABLE',
          areaId: '550e8400-e29b-41d4-a716-446655440004',
          capacity: 0,
          currentOrderId: null,
          isActive: true,
          sortOrder: 0
        }
      });
    }
    
    console.log('✅ Takeaway table created/updated successfully!');
    
    const allTables = await prisma.table.findMany({
      include: { area: true }
    });
    console.log('\n📊 All tables:');
    console.table(allTables.map(t => ({
      id: t.id,
      name: t.name,
      area: t.area.name,
      status: t.status
    })));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTakeawayTable()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
