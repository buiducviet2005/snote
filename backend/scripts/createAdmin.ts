import { prisma } from '../src/shared/db/prismaClient';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const fullName = process.env.ADMIN_NAME || process.argv[4] || 'SNOTE Administrator';

  if (!email || !password) {
    console.error('❌ Sử dụng: npm run admin:create <email> <password> [fullName] hoặc truyền ADMIN_EMAIL và ADMIN_PASSWORD qua biến môi trường');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Mật khẩu admin phải có tối thiểu 8 ký tự!');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (existing) {
    console.error(`❌ Email ${normalizedEmail} đã tồn tại trong hệ thống.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      role: 'ADMIN',
      timezone: 'Asia/Ho_Chi_Minh'
    }
  });

  console.log(`✅ Đã tạo tài khoản quản trị viên an toàn: ${admin.email} (ID: ${admin.id})`);
}

createAdmin()
  .catch((e) => {
    console.error('❌ Lỗi khi tạo admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
