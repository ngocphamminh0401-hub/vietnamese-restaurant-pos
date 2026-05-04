const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing database connection...');
    
    const users = await prisma.user.findMany();
    console.log('✓ Users query OK:', users.length);
    
    const tables = await prisma.table.findMany();
    console.log('✓ Tables query OK:', tables.length);
    
    const inventoryItems = await prisma.inventoryItem.findMany();
    console.log('✓ Inventory items query OK:', inventoryItems.length);
    
    const menuCategories = await prisma.menuCategory.findMany();
    console.log('✓ Menu categories query OK:', menuCategories.length);
    
    const inventoryCategories = await prisma.inventoryCategory.findMany();
    console.log('✓ Inventory categories query OK:', inventoryCategories.length);
    
    const importTransactions = await prisma.importTransaction.findMany();
    console.log('✓ Import transactions query OK:', importTransactions.length);
    
    const exportTransactions = await prisma.exportTransaction.findMany();
    console.log('✓ Export transactions query OK:', exportTransactions.length);
    
    const inventoryChecks = await prisma.inventoryCheck.findMany();
    console.log('✓ Inventory checks query OK:', inventoryChecks.length);
    
    console.log('\n✅ All database queries successful!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
