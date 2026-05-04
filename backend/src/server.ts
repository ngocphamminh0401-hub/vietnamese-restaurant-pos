
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import prisma from './db';

// Catch uncaught errors
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  path: '/socket.io'
});

app.use(cors() as any);
app.use(express.json() as any);

// Helper function to create notification
async function createNotification(type: string, title: string, message: string, data?: any, userId?: string, username?: string) {
    try {
        const notification = await prisma.notification.create({
            data: {
                type,
                title,
                message,
                data: data ? JSON.stringify(data) : null,
                userId,
                username,
                isRead: false
            }
        });
        
        console.log('✅ Notification created:', notification.type, '-', notification.title);
        
        // Emit real-time notification
        io.emit('NEW_NOTIFICATION', notification);
        console.log('📡 Emitted NEW_NOTIFICATION to all clients');
        
        return notification;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
    }
}

// Helper để xử lý BigInt khi trả về JSON
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// --- SEEDING ADMIN ACCOUNT ---
const seedAdmin = async () => {
    try {
        console.log('Checking admin account...');
        const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (!admin) {
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: '123', // Tài khoản mặc định: admin / 123
                    displayName: 'Quản trị hệ thống',
                    role: 'ADMIN',
                    isActive: true
                }
            });
            console.log('✓ Seeded default admin account: admin / 123');
        } else {
            console.log('✓ Admin account exists');
        }
    } catch (e) {
        console.error('✗ Seed Error:', e);
    }
};

// --- SEEDING INITIAL DATA ---
const seedInitialData = async () => {
    try {
        // Seed tables if none exist
        const tableCount = await prisma.table.count();
        console.log(`Current table count: ${tableCount}`);
        if (tableCount === 0) {
            console.log('Seeding initial tables...');
            const tables = [
                { id: 1, name: 'Bàn 1', areaId: '550e8400-e29b-41d4-a716-446655440001', capacity: 4, status: 'AVAILABLE', sortOrder: 1 },
                { id: 2, name: 'Bàn 2', areaId: '550e8400-e29b-41d4-a716-446655440001', capacity: 4, status: 'AVAILABLE', sortOrder: 2 },
                { id: 3, name: 'Bàn 3', areaId: '550e8400-e29b-41d4-a716-446655440001', capacity: 6, status: 'AVAILABLE', sortOrder: 3 },
                { id: 4, name: 'Bàn 4', areaId: '550e8400-e29b-41d4-a716-446655440002', capacity: 8, status: 'AVAILABLE', sortOrder: 4 },
                { id: 5, name: 'VIP 1', areaId: '550e8400-e29b-41d4-a716-446655440003', capacity: 10, status: 'AVAILABLE', sortOrder: 5 },
            ];
            for (const table of tables) {
                try {
                    await prisma.table.create({ data: { ...table, currentOrderId: null, isActive: true } });
                    console.log(`  ✓ Created table: ${table.name}`);
                } catch (createErr: any) {
                    console.warn(`  ⚠️ Skip table ${table.name}:`, createErr.message);
                }
            }
            console.log('✓ Seeded tables complete');
        } else {
            console.log(`ℹ Tables already exist: ${tableCount}`);
        }

        // Seed menu categories if none exist
        const categoryCount = await prisma.menuCategory.count();
        console.log(`Current menu category count: ${categoryCount}`);
        if (categoryCount === 0) {
            console.log('Seeding menu categories...');
            const categories = ['Món chính', 'Món phụ', 'Đồ uống', 'Tráng miệng'];
            for (let i = 0; i < categories.length; i++) {
                try {
                    await prisma.menuCategory.create({ data: { name: categories[i], sortOrder: i } });
                } catch (catErr: any) {
                    console.warn(`  ⚠️ Skip category:`, catErr.message);
                }
            }
            console.log('✓ Seeded menu categories');
        }

        // Seed menu items if none exist
        const menuCount = await prisma.menuItem.count();
        console.log(`Current menu item count: ${menuCount}`);
        if (menuCount === 0) {
            console.log('Seeding menu items...');
            const items = [
                { name: 'Phở Bò', price: 50000, category: 'Món chính', image: '🍜' },
                { name: 'Cơm Tấm', price: 45000, category: 'Món chính', image: '🍚' },
                { name: 'Gỏi Cuốn', price: 30000, category: 'Món phụ', image: '🌯' },
                { name: 'Trà Đá', price: 5000, category: 'Đồ uống', image: '🧊' },
            ];
            for (const item of items) {
                try {
                    await prisma.menuItem.create({ data: { ...item, isActive: true } });
                } catch (itemErr: any) {
                    console.warn(`  ⚠️ Skip menu item:`, itemErr.message);
                }
            }
            console.log('✓ Seeded menu items');
        }

        // Seed inventory items if none exist
        // Auto-seeding disabled - user will add items manually
        const inventoryCount = await prisma.inventoryItem.count();
        console.log(`ℹ Inventory items in database: ${inventoryCount}`);
        console.log('✓ Seed initial data completed successfully');
    } catch (e) {
        console.error('✗ Seed Initial Data Error:', e);
        throw e; // Re-throw để thấy lỗi chi tiết
    }
};

// Seed admin and initial data via API only - не при старте
// seedAdmin().catch(err => console.error('Seed failed:', err));
// seedInitialData() - MOVED to API endpoint to avoid blocking server startup

console.log('✓ Defining routes...');

// --- AUTH ROUTES ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (user && user.password === password) {
            if (!user.isActive) {
                return res.status(401).json({ error: 'Tài khoản đã bị khóa.' });
            }
            
            // Ghi lại lịch sử đăng nhập vào bảng LoginHistory
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            try {
                await prisma.loginHistory.create({
                    data: {
                        userId: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        action: 'LOGIN',
                        ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0]
                    }
                });
                console.log('✓ Login history saved for user:', user.username);
            } catch (historyErr) {
                console.error('✗ Failed to save login history:', historyErr);
            }

            const { password: _, ...userData } = user;
            return res.json(userData);
        }
        res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu.' });
    } catch (e) { 
        res.status(500).json({ error: 'Lỗi hệ thống' }); 
    }
});

app.post('/api/auth/logout', async (req, res) => {
    const { userId, username, displayName } = req.body;
    try {
        if (userId) {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            await prisma.loginHistory.create({
                data: {
                    userId,
                    username,
                    displayName,
                    action: 'LOGOUT',
                    ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0]
                }
            });
            console.log('✓ Logout history saved for user:', username);
        }
        res.json({ success: true });
    } catch (e) {
        console.error('✗ Logout error:', e);
        res.status(500).json({ error: 'Logout log error' });
    }
});

app.get('/api/auth/history', async (req, res) => {
    try {
        const history = await prisma.loginHistory.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        console.log('✓ Fetched', history.length, 'login history records');
        res.json(history);
    } catch (e) {
        console.error('✗ Failed to fetch login history:', e);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// --- USER MANAGEMENT ROUTES ---

app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({ 
            orderBy: { createdAt: 'desc' },
            select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true }
        });
        res.json(users);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.post('/api/users/create', async (req, res) => {
    try {
        const { username, password, displayName, role, isActive } = req.body;
        const user = await prisma.user.create({
            data: { username, password, displayName, role, isActive }
        });
        io.emit('DATA_UPDATED');
        res.json(user);
    } catch (e) { res.status(400).json({ error: 'Tên đăng nhập đã tồn tại.' }); }
});

app.post('/api/users/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password, displayName, role, isActive } = req.body;
        const updateData: any = { displayName, role, isActive };
        if (password && password.trim() !== '') {
            updateData.password = password;
        }
        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });
        io.emit('DATA_UPDATED');
        res.json(user);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/users/delete/:id', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- POS API ROUTES ---

app.get('/api/init', async (req, res) => {
  try {
    console.log('API Init: Starting data fetch...');
    const areas = await prisma.area.findMany({ orderBy: { sortOrder: 'asc' } });
    console.log('API Init: Areas loaded:', areas.length);
    const tables = await prisma.table.findMany({ 
      orderBy: { id: 'asc' },
      include: { area: true }
    });
    console.log('API Init: Tables loaded:', tables.length);
    const orders = await prisma.order.findMany({ 
        where: { status: { not: 'CANCELLED' } },
        include: { items: true } 
    });
    const reservations = await prisma.reservation.findMany({
        include: { tables: true }
    });
    const menu = await prisma.menuItem.findMany();
    const staff = await prisma.staff.findMany();
    const customers = await prisma.customer.findMany();
    const suppliers = await prisma.supplier.findMany();
    const inventoryItems = await prisma.inventoryItem.findMany();
    console.log('API Init: Basic data loaded');
    const importTransactions = await prisma.importTransaction.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });
    console.log('API Init: Import transactions:', importTransactions.length);
    const exportTransactions = await prisma.exportTransaction.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });
    console.log('API Init: Export transactions:', exportTransactions.length);
    const menuCategories = await prisma.menuCategory.findMany({ orderBy: { sortOrder: 'asc' } });
    console.log('API Init: Menu categories:', menuCategories.length);
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 notifications
    });
    console.log('API Init: Notifications:', notifications.length);
    console.log('API Init: All data loaded, preparing response...');

    console.log('API Init: Preparing response...');
    res.json({
      areas,
      tables,
      orders,
      reservations: reservations.map((r: any) => {
        try {
          return {
            ...r, 
            preOrderItems: typeof r.preOrderItems === 'string' ? JSON.parse(r.preOrderItems) : (r.preOrderItems || [])
          };
        } catch (e) {
          console.error('Error parsing reservation preOrderItems:', e);
          return { ...r, preOrderItems: [] };
        }
      }),
      menu,
      staff,
      customers,
      suppliers,
      inventoryItems,
      importTransactions,
      exportTransactions,
      menuCategories,
      categories: menuCategories.map((c: any) => c.name), // For backward compatibility
      notifications
    });
    console.log('API Init: Response sent successfully!');
  } catch (error: any) {
    console.error('API Init Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to load data', message: error.message });
  }
});

app.post('/api/orders/create', async (req, res) => {
    try {
        const { order, tableId } = req.body;
        await prisma.order.create({
            data: {
                id: order.id,
                tableId: order.tableId,
                startTime: BigInt(order.startTime),
                isPaid: false,
                status: 'ACTIVE',
                reservationId: order.reservationId
            }
        });
        await prisma.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED', currentOrderId: order.id }
        });
        
        // Nếu order này liên kết với reservation → cập nhật status sang CHECKED_IN
        if (order.reservationId) {
            await prisma.reservation.update({
                where: { id: order.reservationId },
                data: { status: 'CHECKED_IN' }
            });
            console.log('✓ Updated reservation', order.reservationId, 'to CHECKED_IN');
        }
        
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e}); }
});

app.post('/api/orders/update-items', async (req, res) => {
    try {
        const { orderId, items, tableId, info } = req.body;
        await prisma.$transaction([
            prisma.orderItem.deleteMany({ where: { orderId } }),
            prisma.orderItem.createMany({
                data: items.map((i: any) => ({
                    orderId,
                    itemId: i.itemId,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    returnedQuantity: i.returnedQuantity || 0,
                    status: i.status,
                    note: i.note,
                    timestamp: BigInt(i.timestamp),
                    cancelReason: i.cancelReason
                }))
            })
        ]);
        if(info) {
            await prisma.order.update({ where: { id: orderId }, data: info });
        }
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e}); }
});

// Cancel order item
app.post('/api/orders/cancel-item', async (req, res) => {
    try {
        const { orderId, itemId, cancelReason, userId, username } = req.body;
        
        // Get item and table info before cancellation
        const item = await prisma.orderItem.findUnique({
            where: { id: itemId }
        });
        
        const order = item ? await prisma.order.findUnique({
            where: { id: item.orderId }
        }) : null;
        
        const table = order ? await prisma.table.findUnique({
            where: { id: order.tableId },
            include: { area: true }
        }) : null;
        
        await prisma.orderItem.updateMany({
            where: { 
                orderId,
                id: itemId
            },
            data: {
                status: 'CANCELLED',
                cancelReason: cancelReason || 'Khách hủy'
            }
        });
        
        // Create notification for manager
        if (item && table) {
            await createNotification(
                'ITEM_CANCELLED',
                '❌ Món đã bị hủy',
                `Món "${item.name}" (${item.quantity}x) tại ${table.name} (${table.area?.name}) đã bị hủy. Lý do: ${cancelReason || 'Khách hủy'}`,
                {
                    orderId,
                    itemId,
                    itemName: item.name,
                    quantity: item.quantity,
                    tableId: table.id,
                    tableName: table.name,
                    areaName: table.area?.name,
                    cancelReason: cancelReason || 'Khách hủy'
                },
                userId,
                username
            );
        }
        
        console.log('✓ Cancelled item:', itemId, 'Reason:', cancelReason);
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) {
        console.error('✗ Cancel item error:', e);
        res.status(500).json({error: e});
    }
});

// Link reservation to existing order
app.post('/api/orders/link-reservation', async (req, res) => {
    try {
        const { orderId, reservationId, guestCount, note } = req.body;
        
        // Update order with reservation info
        await prisma.order.update({
            where: { id: orderId },
            data: { 
                reservationId,
                guestCount: guestCount || undefined,
                note: note || undefined
            }
        });
        
        // Update reservation status to CHECKED_IN
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: 'CHECKED_IN' }
        });
        
        console.log('✓ Linked reservation', reservationId, 'to order', orderId);
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) {
        console.error('✗ Link reservation error:', e);
        res.status(500).json({error: e});
    }
});

app.post('/api/orders/pay', async (req, res) => {
    try {
        const { orderId, tableId, discountAmount, discountPercent, discountType, discountReason, finalAmount } = req.body;
        await prisma.order.update({
            where: { id: orderId },
            data: { 
                isPaid: true, 
                status: 'COMPLETED',
                discountAmount, 
                discountPercent,
                discountType,
                discountReason,
                finalAmount 
            }
        });
        await prisma.table.update({
            where: { id: tableId },
            data: { status: 'AVAILABLE', currentOrderId: null }
        });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e}); }
});

// Mark item as out of stock and notify affected tables
app.post('/api/menu/out-of-stock', async (req, res) => {
    try {
        const { itemName, itemId, userId, username } = req.body;
        
        // Find all active orders with this item
        const activeOrders = await prisma.order.findMany({
            where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
                isPaid: false,
                items: {
                    some: {
                        itemId: itemId,
                        status: { in: ['PENDING', 'COOKING'] }
                    }
                }
            },
            include: {
                items: true
            }
        });
        
        // Get table names for affected orders
        const tableIds = [...new Set(activeOrders.map(order => order.tableId))];
        const tables = await prisma.table.findMany({
            where: { id: { in: tableIds } }
        });
        const affectedTables = tables.map(table => table.name);
        
        if (affectedTables.length > 0) {
            await createNotification(
                'ITEM_OUT_OF_STOCK',
                '⚠️ Món đã hết',
                `Bếp báo hết món "${itemName}". Các bàn bị ảnh hưởng: ${affectedTables.join(', ')}`,
                {
                    itemName,
                    itemId,
                    affectedTables,
                    affectedOrderIds: activeOrders.map(o => o.id)
                },
                userId,
                username
            );
        }
        
        io.emit('DATA_UPDATED');
        io.emit('ITEM_OUT_OF_STOCK', { itemName, itemId, affectedTables });
        
        res.json({ 
            success: true, 
            affectedTables: affectedTables.length,
            tables: affectedTables 
        });
    } catch (e) {
        console.error('Out of stock error:', e);
        res.status(500).json({ error: e });
    }
});

// Toggle menu item out of stock status
app.post('/api/menu/toggle-out-of-stock', async (req, res) => {
    try {
        const { itemId, isOutOfStock, userId, username } = req.body;
        
        // Update menu item
        const menuItem = await prisma.menuItem.update({
            where: { id: itemId },
            data: { isOutOfStock }
        });
        
        const notificationType = isOutOfStock ? 'ITEM_OUT_OF_STOCK' : 'ITEM_BACK_IN_STOCK';
        const notificationTitle = isOutOfStock ? '⚠️ Món đã hết' : '✅ Món đã có lại';
        const notificationMessage = isOutOfStock 
            ? `Món "${menuItem.name}" đã được đánh dấu HẾT. Phục vụ vui lòng không nhận order món này.`
            : `Món "${menuItem.name}" đã có lại. Phục vụ có thể nhận order bình thường.`;
        
        // Create notification for waiters and managers
        await createNotification(
            notificationType,
            notificationTitle,
            notificationMessage,
            {
                itemId: menuItem.id,
                itemName: menuItem.name,
                isOutOfStock
            },
            userId,
            username
        );
        
        // Also update isActive status if marking as out of stock
        if (isOutOfStock) {
            await prisma.menuItem.update({
                where: { id: itemId },
                data: { isActive: false }
            });
        }
        
        io.emit('DATA_UPDATED');
        
        res.json({ 
            success: true,
            menuItem
        });
    } catch (e) {
        console.error('Toggle out of stock error:', e);
        res.status(500).json({ error: e });
    }
});

// Cancel entire order
app.post('/api/orders/cancel', async (req, res) => {
    try {
        const { orderId, tableId, reason, userId, username } = req.body;
        
        // Get order details before cancellation
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Get table info
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: { area: true }
        });
        
        // Cancel order
        await prisma.order.update({
            where: { id: orderId },
            data: { 
                status: 'CANCELLED',
                cancelReason: reason
            }
        });
        
        // Release table
        await prisma.table.update({
            where: { id: tableId },
            data: { 
                status: 'AVAILABLE',
                currentOrderId: null
            }
        });
        
        // Create notification
        await createNotification(
            'ORDER_CANCELLED',
            '🚫 Hóa đơn đã bị hủy',
            `Hóa đơn #${orderId.slice(-6)} tại ${table?.name} (${table?.area?.name}) đã bị hủy. Lý do: ${reason}`,
            {
                orderId,
                tableId,
                tableName: table?.name,
                areaName: table?.area?.name,
                reason,
                totalItems: order.items.length
            },
            userId,
            username
        );
        
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) {
        console.error('Cancel order error:', e);
        res.status(500).json({ error: e });
    }
});

app.post('/api/orders/merge', async (req, res) => {
    try {
        const { sourceTableIds, targetTableId, targetOrderId } = req.body;
        
        // Get all source orders
        const sourceOrders = await prisma.order.findMany({
            where: {
                tableId: { in: sourceTableIds },
                status: 'ACTIVE'
            },
            include: { items: true }
        });

        if (sourceOrders.length === 0) {
            return res.status(400).json({ error: 'No active orders found to merge' });
        }

        // Get target order
        const targetOrder = await prisma.order.findUnique({
            where: { id: targetOrderId },
            include: { items: true }
        });

        if (!targetOrder) {
            return res.status(400).json({ error: 'Target order not found' });
        }

        // Collect all items from source orders
        const allItems = sourceOrders.flatMap((order: any) => order.items);

        // Add all items to target order
        await prisma.orderItem.createMany({
            data: allItems.map((item: any) => ({
                orderId: targetOrderId,
                itemId: item.itemId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                returnedQuantity: item.returnedQuantity || 0,
                status: item.status,
                note: item.note,
                timestamp: item.timestamp,
                cancelReason: item.cancelReason
            }))
        });

        // Delete source orders and free up tables
        await prisma.$transaction([
            prisma.orderItem.deleteMany({
                where: { orderId: { in: sourceOrders.map((o: any) => o.id) } }
            }),
            prisma.order.deleteMany({
                where: { id: { in: sourceOrders.map((o: any) => o.id) } }
            }),
            prisma.table.updateMany({
                where: { id: { in: sourceTableIds } },
                data: { status: 'AVAILABLE', currentOrderId: null }
            })
        ]);
        
        // Get table info for notification
        const sourceTables = await prisma.table.findMany({
            where: { id: { in: sourceTableIds } },
            include: { area: true }
        });
        const targetTable = await prisma.table.findUnique({
            where: { id: targetTableId },
            include: { area: true }
        });
        
        const { userId, username } = req.body;
        
        // Create notification
        await createNotification(
            'ORDER_MERGED',
            '🔀 Hóa đơn đã được ghép',
            `Đã ghép ${sourceOrders.length} hóa đơn từ ${sourceTables.map((t: any) => t.name).join(', ')} vào ${targetTable?.name}`,
            {
                sourceTableIds,
                targetTableId,
                sourceTableNames: sourceTables.map((t: any) => t.name),
                targetTableName: targetTable?.name,
                totalOrders: sourceOrders.length,
                totalItems: allItems.length
            },
            userId,
            username
        );

        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { 
        console.error('Merge error:', e);
        res.status(500).json({error: e}); 
    }
});

app.post('/api/orders/split', async (req, res) => {
    try {
        const { sourceTableId, targetTableId, itemsToMove, sourceOrderId } = req.body;

        // Get source order
        const sourceOrder = await prisma.order.findUnique({
            where: { id: sourceOrderId },
            include: { items: true }
        });

        if (!sourceOrder) {
            return res.status(400).json({ error: 'Source order not found' });
        }

        // Create new order for target table
        const newOrderId = `ORD${Date.now()}`;
        await prisma.order.create({
            data: {
                id: newOrderId,
                tableId: targetTableId,
                startTime: BigInt(Date.now()),
                isPaid: false,
                status: 'ACTIVE'
            }
        });

        // Move items to new order
        await prisma.orderItem.createMany({
            data: itemsToMove.map((item: any) => ({
                orderId: newOrderId,
                itemId: item.itemId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                returnedQuantity: item.returnedQuantity || 0,
                status: item.status,
                note: item.note,
                timestamp: BigInt(item.timestamp),
                cancelReason: item.cancelReason
            }))
        });

        // Remove moved items from source order
        const itemsToMoveIds = itemsToMove.map((item: any) => item.itemId);
        await prisma.orderItem.deleteMany({
            where: {
                orderId: sourceOrderId,
                itemId: { in: itemsToMoveIds }
            }
        });

        // Update target table status
        await prisma.table.update({
            where: { id: targetTableId },
            data: { status: 'OCCUPIED', currentOrderId: newOrderId }
        });

        // Check if source order still has items
        const remainingItems = await prisma.orderItem.count({
            where: { orderId: sourceOrderId }
        });

        // If no items left, delete source order and free table
        if (remainingItems === 0) {
            await prisma.order.delete({ where: { id: sourceOrderId } });
            await prisma.table.update({
                where: { id: sourceTableId },
                data: { status: 'AVAILABLE', currentOrderId: null }
            });
        }
        
        // Get table info for notification
        const sourceTable = await prisma.table.findUnique({
            where: { id: sourceTableId },
            include: { area: true }
        });
        const targetTable = await prisma.table.findUnique({
            where: { id: targetTableId },
            include: { area: true }
        });
        
        const { userId, username } = req.body;
        
        // Create notification
        await createNotification(
            'ORDER_SPLIT',
            '✂️ Hóa đơn đã được tách',
            `Đã tách ${itemsToMove.length} món từ ${sourceTable?.name} sang ${targetTable?.name}`,
            {
                sourceTableId,
                targetTableId,
                sourceTableName: sourceTable?.name,
                targetTableName: targetTable?.name,
                movedItems: itemsToMove.length,
                remainingItems
            },
            userId,
            username
        );

        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { 
        console.error('Split error:', e);
        res.status(500).json({error: e}); 
    }
});

// --- STAFF MANAGEMENT ROUTES ---
app.post('/api/staff/create', async (req, res) => {
    try {
        const { code, name, phone, role, department, cccd, gender, startDate, address, status } = req.body;
        const staff = await prisma.staff.create({
            data: { 
                code, 
                name, 
                phone, 
                role: role || 'WAITER',
                department: department || 'Bàn',
                cccd: cccd || '',
                gender: gender || 'MALE',
                startDate: new Date(startDate), 
                address: address || '',
                status: status || 'ACTIVE'
            }
        });
        io.emit('DATA_UPDATED');
        res.json(staff);
    } catch (e) { 
        console.error('Staff create error:', e);
        res.status(500).json({ error: 'Failed to create staff' }); 
    }
});

app.get('/api/staff', async (req, res) => {
    try {
        const staff = await prisma.staff.findMany({
            orderBy: { startDate: 'desc' }
        });
        res.json(staff);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.put('/api/staff/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, role, department, address, status } = req.body;
        const staff = await prisma.staff.update({
            where: { id },
            data: { name, phone, role, department, address, status }
        });
        io.emit('DATA_UPDATED');
        res.json(staff);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/staff/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.staff.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- CUSTOMER MANAGEMENT ROUTES ---
app.post('/api/customers/create', async (req, res) => {
    try {
        const { code, name, phone, email, address } = req.body;
        const customer = await prisma.customer.create({
            data: { 
                code, 
                name, 
                phone, 
                email: email || null,
                address: address || null
            }
        });
        io.emit('DATA_UPDATED');
        res.json(customer);
    } catch (e) { 
        console.error('Customer create error:', e);
        res.status(500).json({ error: 'Failed to create customer' }); 
    }
});

app.get('/api/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(customers);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.put('/api/customers/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;
        const customer = await prisma.customer.update({
            where: { id },
            data: { name, phone, email, address }
        });
        io.emit('DATA_UPDATED');
        res.json(customer);
    } catch (e) { res.status(500).json({ error: e }); }
});

// RESTful alias
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;
        const customer = await prisma.customer.update({
            where: { id },
            data: { name, phone, email, address }
        });
        io.emit('DATA_UPDATED');
        res.json(customer);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/customers/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customer.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// RESTful alias
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customer.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- SUPPLIER MANAGEMENT ROUTES ---
app.post('/api/suppliers/create', async (req, res) => {
    try {
        const { code, name, contactName, phone, email, address, taxCode } = req.body;
        const supplier = await prisma.supplier.create({
            data: { 
                code, 
                name, 
                contactName: contactName || null,
                phone, 
                email: email || null,
                address: address || null,
                taxCode: taxCode || null
            }
        });
        io.emit('DATA_UPDATED');
        res.json(supplier);
    } catch (e) { 
        console.error('Supplier create error:', e);
        res.status(500).json({ error: 'Failed to create supplier' }); 
    }
});

app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(suppliers);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.put('/api/suppliers/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contactName, phone, email, address, taxCode } = req.body;
        const supplier = await prisma.supplier.update({
            where: { id },
            data: { name, contactName, phone, email, address, taxCode }
        });
        io.emit('DATA_UPDATED');
        res.json(supplier);
    } catch (e) { res.status(500).json({ error: e }); }
});

// RESTful alias
app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contactName, phone, email, address, taxCode } = req.body;
        const supplier = await prisma.supplier.update({
            where: { id },
            data: { name, contactName, phone, email, address, taxCode }
        });
        io.emit('DATA_UPDATED');
        res.json(supplier);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/suppliers/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.supplier.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// RESTful alias
app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.supplier.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- NOTIFICATION MANAGEMENT ROUTES ---
// NOTIFICATION ENDPOINTS
app.post('/api/notifications/create', async (req, res) => {
    try {
        const { type, title, message, data, targetRoles, userId, username } = req.body;
        
        console.log('📥 Received notification request:', { type, title, message, targetRoles, userId, username });
        
        // Parse data if it's a string
        const dataToStore = typeof data === 'string' ? data : (data ? JSON.stringify(data) : null);
        
        const notification = await prisma.notification.create({
            data: {
                type,
                title,
                message,
                data: dataToStore,
                targetRoles: targetRoles || 'WAITER,MANAGER',
                userId: userId || '',
                username: username || 'System',
                isRead: false
            }
        });
        
        console.log('✅ Notification created:', notification.id, notification.title);
        
        // Emit real-time notification
        io.emit('NEW_NOTIFICATION', notification);
        console.log('📡 Emitted NEW_NOTIFICATION via socket');
        
        res.json(notification);
    } catch (e: any) { 
        console.error('❌ Error creating notification:', e);
        res.status(500).json({ error: e.message || 'Failed to create notification' }); 
    }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.put('/api/notifications/mark-read/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        io.emit('DATA_UPDATED');
        res.json(notification);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.put('/api/notifications/mark-all-read', async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- INVENTORY ITEM MANAGEMENT ROUTES ---
app.post('/api/inventory/create', async (req, res) => {
    try {
        const { code, name, unit, quantity, minStock, price, category, supplierId } = req.body;
        const item = await prisma.inventoryItem.create({
            data: { 
                code, 
                name, 
                unit, 
                quantity: quantity || 0,
                minStock: minStock || 0,
                price: price || 0,
                category,
                supplierId: supplierId || null
            }
        });
        io.emit('DATA_UPDATED');
        res.json(item);
    } catch (e) { 
        console.error('Inventory item create error:', e);
        res.status(500).json({ error: 'Failed to create inventory item' }); 
    }
});

app.get('/api/inventory', async (req, res) => {
    try {
        const items = await prisma.inventoryItem.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.put('/api/inventory/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, unit, quantity, minStock, price, category, supplierId } = req.body;
        const item = await prisma.inventoryItem.update({
            where: { id },
            data: { name, unit, quantity, minStock, price, category, supplierId }
        });
        io.emit('DATA_UPDATED');
        res.json(item);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/inventory/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.inventoryItem.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- MENU ITEM MANAGEMENT ROUTES ---
app.post('/api/menu/create', async (req, res) => {
    try {
        const { name, price, category, image, unit, isActive } = req.body;
        const item = await prisma.menuItem.create({
            data: { name, price, category, image: image || '', unit: unit || null, isActive: isActive !== false }
        });
        io.emit('DATA_UPDATED');
        res.json(item);
    } catch (e) { 
        console.error('Menu item create error:', e);
        res.status(500).json({ error: 'Failed to create menu item' }); 
    }
});

app.put('/api/menu/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, image, unit, isActive } = req.body;
        const item = await prisma.menuItem.update({
            where: { id },
            data: { name, price, category, image, unit, isActive }
        });
        io.emit('DATA_UPDATED');
        res.json(item);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/menu/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.menuItem.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- MENU CATEGORY MANAGEMENT ROUTES ---
app.post('/api/categories/create', async (req, res) => {
    try {
        const { name, sortOrder } = req.body;
        const category = await prisma.menuCategory.create({
            data: { name, sortOrder: sortOrder || 0 }
        });
        io.emit('DATA_UPDATED');
        res.json(category);
    } catch (e) { 
        console.error('Menu category create error:', e);
        res.status(500).json({ error: 'Failed to create category' }); 
    }
});

app.delete('/api/categories/delete/:name', async (req, res) => {
    try {
        const { name } = req.params;
        await prisma.menuCategory.delete({ where: { name } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- AREA MANAGEMENT ROUTES ---
app.get('/api/areas', async (req, res) => {
    try {
        const areas = await prisma.area.findMany({ orderBy: { sortOrder: 'asc' } });
        res.json(areas);
    } catch (e) { 
        console.error('Areas fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch areas' }); 
    }
});

app.post('/api/areas/create', async (req, res) => {
    try {
        const { code, name, sortOrder } = req.body;
        const area = await prisma.area.create({
            data: { 
                code,
                name,
                isActive: true,
                sortOrder: sortOrder || 0
            }
        });
        io.emit('DATA_UPDATED');
        res.json(area);
    } catch (e) { 
        console.error('Area create error:', e);
        res.status(500).json({ error: 'Failed to create area' }); 
    }
});

app.put('/api/areas/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, isActive, sortOrder } = req.body;
        const area = await prisma.area.update({
            where: { id },
            data: { code, name, isActive, sortOrder }
        });
        io.emit('DATA_UPDATED');
        res.json(area);
    } catch (e) { 
        console.error('Area update error:', e);
        res.status(500).json({ error: 'Failed to update area' }); 
    }
});

app.delete('/api/areas/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if area has tables
        const tablesCount = await prisma.table.count({ where: { areaId: id } });
        if (tablesCount > 0) {
            return res.status(400).json({ error: 'Cannot delete area with existing tables' });
        }
        await prisma.area.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { 
        console.error('Area delete error:', e);
        res.status(500).json({ error: 'Failed to delete area' }); 
    }
});

// --- TABLE MANAGEMENT ROUTES ---
app.post('/api/tables/create', async (req, res) => {
    try {
        const { name, areaId, capacity, sortOrder, note } = req.body;
        
        // Find the highest table ID and increment
        const maxTable = await prisma.table.findFirst({
            orderBy: { id: 'desc' }
        });
        const newId = (maxTable?.id || 0) + 1;
        
        const table = await prisma.table.create({
            data: { 
                id: newId, 
                name, 
                status: 'AVAILABLE', 
                areaId, 
                capacity, 
                currentOrderId: null, 
                isActive: true,
                sortOrder: sortOrder || 0
            },
            include: { area: true }
        });
        io.emit('DATA_UPDATED');
        res.json(table);
    } catch (e) { 
        console.error('Table create error:', e);
        res.status(500).json({ error: 'Failed to create table' }); 
    }
});

app.put('/api/tables/update/:id', async (req, res) => {
    try {
        const tableId = parseInt(req.params.id);
        const { name, areaId, capacity, isActive, sortOrder } = req.body;
        const table = await prisma.table.update({
            where: { id: tableId },
            data: { name, areaId, capacity, isActive, sortOrder },
            include: { area: true }
        });
        io.emit('DATA_UPDATED');
        res.json(table);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/tables/delete/:id', async (req, res) => {
    try {
        const tableId = parseInt(req.params.id);
        await prisma.table.delete({ where: { id: tableId } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- RESERVATION MANAGEMENT ROUTES ---
app.post('/api/reservations/create', async (req, res) => {
    try {
        const { code, customerName, phoneNumber, address, arrivalTime, guestCount, durationHours, depositAmount, depositMethod, note, preOrderItems, tableIds } = req.body;
        
        const reservationId = `RES-${Date.now()}`;
        
        // Xác định status: nếu đã chọn bàn → ASSIGNED, chưa chọn → PENDING
        const hasSelectedTables = tableIds && tableIds.length > 0;
        const initialStatus = hasSelectedTables ? 'ASSIGNED' : 'PENDING';
        
        // Create reservation with tables
        const reservation = await prisma.reservation.create({
            data: {
                id: reservationId,
                code,
                status: initialStatus,
                customerName,
                phoneNumber,
                address: address || '',
                arrivalTime: new Date(arrivalTime),
                guestCount,
                durationHours,
                depositAmount: depositAmount || 0,
                depositMethod: depositMethod || null,
                note: note || '',
                preOrderItems: preOrderItems ? JSON.stringify(preOrderItems) : null,
                tables: {
                    create: (tableIds || []).map((tableId: number) => ({ tableId }))
                }
            },
            include: { tables: true }
        });
        
        console.log('✓ Reservation created:', code, 'with', tableIds?.length || 0, 'tables');
        
        // MẮT XÍCH 2: Emit socket event để thông báo cho tất cả clients
        // Gửi cả dữ liệu cụ thể để tránh phải fetch lại toàn bộ (optimization)
        io.emit('DATA_UPDATED', { type: 'RESERVATION_CREATED', data: reservation });
        console.log('📡 Socket RESERVATION_CREATED emitted to all clients');
        
        res.json(reservation);
    } catch (e) {
        console.error('Reservation create error:', e);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

app.get('/api/reservations', async (req, res) => {
    try {
        const reservations = await prisma.reservation.findMany({
            include: { tables: true }
        });
        res.json(reservations.map((r: any) => ({
            ...r,
            preOrderItems: r.preOrderItems ? JSON.parse(r.preOrderItems) : []
        })));
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

app.put('/api/reservations/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, customerName, phoneNumber, address, arrivalTime, guestCount, durationHours, depositAmount, depositMethod, note, preOrderItems, tableIds } = req.body;
        
        // Delete existing table associations (if updating tables)
        if (tableIds !== undefined) {
            await prisma.$executeRaw`DELETE FROM "ReservationTable" WHERE "reservationId" = ${id}`;
        }
        
        // Update reservation with new tables
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                status,
                customerName,
                phoneNumber,
                address,
                arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
                guestCount,
                durationHours,
                depositAmount,
                depositMethod,
                note,
                preOrderItems: preOrderItems ? JSON.stringify(preOrderItems) : undefined,
                tables: {
                    create: (tableIds || []).map((tableId: number) => ({ tableId }))
                }
            },
            include: { tables: true }
        });
        
        io.emit('DATA_UPDATED');
        res.json(reservation);
    } catch (e) {
        console.error('Reservation update error:', e);
        res.status(500).json({ error: e });
    }
});

app.delete('/api/reservations/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.reservation.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

// --- IMPORT TRANSACTION ROUTES ---
app.post('/api/import/create', async (req, res) => {
    try {
        const { code, supplierId, supplierName, items, totalAmount, note, createdBy } = req.body;
        console.log('Creating import transaction:', { code, supplierName, itemsCount: items.length });
        
        // Create import transaction with items
        const importTrans = await prisma.importTransaction.create({
            data: { 
                code, 
                supplierId,
                supplierName,
                totalAmount,
                note: note || '',
                createdBy,
                items: {
                    create: items.map((item: any) => ({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        unit: item.unit || '',
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.quantity * item.price
                    }))
                }
            },
            include: { items: true }
        });

        // Update inventory quantities - only if item exists
        for (const item of items) {
            let existingItem = await prisma.inventoryItem.findUnique({
                where: { id: item.itemId }
            });
            
            // If not found by ID, try to find by name
            if (!existingItem) {
                existingItem = await prisma.inventoryItem.findFirst({
                    where: { name: item.itemName }
                });
                if (existingItem) {
                    console.log(`✓ Found item by name: ${item.itemName} -> ${existingItem.id}`);
                }
            }
            
            if (existingItem) {
                const newQuantity = existingItem.quantity + item.quantity;
                await prisma.inventoryItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: { increment: item.quantity } }
                });
                console.log(`✓ Updated inventory: ${existingItem.name} (${existingItem.code}): ${existingItem.quantity} + ${item.quantity} = ${newQuantity}`);
            } else {
                console.warn(`⚠️ Inventory item not found: ${item.itemId} (${item.itemName}) - Stock not updated`);
            }
        }

        console.log('Import transaction created successfully:', importTrans.id);
        io.emit('DATA_UPDATED');
        res.json(importTrans);
    } catch (e) { 
        console.error('Import transaction error:', e);
        res.status(500).json({ error: 'Failed to create import transaction' }); 
    }
});

app.get('/api/import', async (req, res) => {
    try {
        const transactions = await prisma.importTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });
        res.json(transactions);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.get('/api/import/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.importTransaction.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Import transaction not found' });
        }
        res.json(transaction);
    } catch (e) { res.status(500).json({ error: e }); }
});

// --- EXPORT TRANSACTION ROUTES ---
app.post('/api/export/create', async (req, res) => {
    try {
        const { code, reason, items, totalAmount, note, createdBy } = req.body;
        
        // Validate stock availability
        for (const item of items) {
            const invItem = await prisma.inventoryItem.findUnique({
                where: { id: item.itemId }
            });
            if (!invItem || invItem.quantity < item.quantity) {
                return res.status(400).json({ 
                    error: `Không đủ tồn kho cho ${item.itemName}. Hiện có: ${invItem?.quantity || 0}, Cần: ${item.quantity}` 
                });
            }
        }

        // Create export transaction with items
        const exportTrans = await prisma.exportTransaction.create({
            data: { 
                code, 
                reason,
                totalAmount,
                note: note || '',
                createdBy,
                items: {
                    create: items.map((item: any) => ({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        unit: item.unit || '',
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.quantity * item.price
                    }))
                }
            },
            include: { items: true }
        });

        // Update inventory quantities - only if item exists
        for (const item of items) {
            let existingItem = await prisma.inventoryItem.findUnique({
                where: { id: item.itemId }
            });
            
            // If not found by ID, try to find by name
            if (!existingItem) {
                existingItem = await prisma.inventoryItem.findFirst({
                    where: { name: item.itemName }
                });
                if (existingItem) {
                    console.log(`✓ Found item by name: ${item.itemName} -> ${existingItem.id}`);
                }
            }
            
            if (existingItem) {
                const newQuantity = existingItem.quantity - item.quantity;
                await prisma.inventoryItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: { decrement: item.quantity } }
                });
                console.log(`✓ Updated inventory: ${existingItem.name} (${existingItem.code}): ${existingItem.quantity} - ${item.quantity} = ${newQuantity}`);
            } else {
                console.warn(`⚠️ Inventory item not found: ${item.itemId} (${item.itemName}) - Stock not updated`);
            }
        }

        io.emit('DATA_UPDATED');
        res.json(exportTrans);
    } catch (e) { 
        console.error('Export transaction error:', e);
        res.status(500).json({ error: 'Failed to create export transaction' }); 
    }
});

app.get('/api/export', async (req, res) => {
    try {
        const transactions = await prisma.exportTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });
        res.json(transactions);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.get('/api/export/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.exportTransaction.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Export transaction not found' });
        }
        res.json(transaction);
    } catch (e) { res.status(500).json({ error: e }); }
});
// --- CATEGORY MANAGEMENT ROUTES ---
app.get('/api/categories/menu', async (req, res) => {
    try {
        const categories = await prisma.menuCategory.findMany({ orderBy: { sortOrder: 'asc' } });
        res.json(categories);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.post('/api/categories/menu', async (req, res) => {
    try {
        const { name } = req.body;
        const category = await prisma.menuCategory.create({
            data: { name, sortOrder: 0 }
        });
        io.emit('DATA_UPDATED');
        res.json(category);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/api/categories/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.menuCategory.delete({ where: { id } });
        io.emit('DATA_UPDATED');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
});

// Seed ALL data API (admin + tables + menu)
app.post('/api/seed', async (req, res) => {
    try {
        console.log('🌱 Manual seed initiated...');
        await seedAdmin();
        await seedInitialData();
        io.emit('DATA_UPDATED');
        res.json({ success: true, message: 'Seeded admin, tables, and menu successfully' });
    } catch (e: any) {
        console.error('Seed error:', e);
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});

// --- NOTIFICATION ROUTES ---
app.get('/api/notifications', async (req, res) => {
    try {
        const { limit = 50, unreadOnly = 'false' } = req.query;
        const where = unreadOnly === 'true' ? { isRead: false } : {};
        
        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string)
        });
        
        res.json(notifications);
    } catch (e) {
        console.error('Notifications fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Duplicate removed - using main endpoint above

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json(notification);
    } catch (e) {
        console.error('Notification update error:', e);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

app.put('/api/notifications/mark-all-read', async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (e) {
        console.error('Mark all read error:', e);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        console.error('Notification delete error:', e);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Backend Server running on http://localhost:${PORT}`);
  console.log(`✓ Ready to accept connections`);
}).on('error', (error: any) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately - log and continue for debugging
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately - log and continue for debugging
});
