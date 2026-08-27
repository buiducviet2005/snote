import { prisma } from '../src/shared/db/prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seeding SNOTE database)...');

  // 1. Tạo User Admin mẫu
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@snote.edu.vn' },
    update: {
      role: 'ADMIN',
      passwordHash: adminPasswordHash
    },
    create: {
      email: 'admin@snote.edu.vn',
      fullName: 'Quản Trị Viên Hệ Thống (SNOTE Admin)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      timezone: 'Asia/Ho_Chi_Minh'
    }
  });
  console.log(`👑 Đã tạo/cập nhật user Admin: ${adminUser.email} (${adminUser.id})`);

  // 2. Tạo User sinh viên mẫu
  const studentPasswordHash = await bcrypt.hash('Student@123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'sinhvien@snote.edu.vn' },
    update: {
      role: 'STUDENT',
      passwordHash: studentPasswordHash
    },
    create: {
      email: 'sinhvien@snote.edu.vn',
      fullName: 'Nguyễn Văn Sinh Viên',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      timezone: 'Asia/Ho_Chi_Minh'
    }
  });
  console.log(`✅ Đã tạo user sinh viên mẫu: ${user.email} (${user.id})`);

  // 3. Tạo Học kỳ mẫu nếu chưa có
  let semester = await prisma.semester.findFirst({
    where: { userId: user.id, isCurrent: true }
  });

  if (!semester) {
    semester = await prisma.semester.create({
      data: {
        userId: user.id,
        name: 'Học kỳ 1 (2025 - 2026)',
        academicYear: '2025-2026',
        isCurrent: true,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-01-15')
      }
    });
  }
  console.log(`✅ Đã sẵn sàng học kỳ: ${semester.name}`);

  // 4. Tạo Các Môn học nếu chưa có
  let dbSubject = await prisma.subject.findFirst({
    where: { userId: user.id, name: 'Cơ sở dữ liệu' }
  });
  if (!dbSubject) {
    dbSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        semesterId: semester.id,
        name: 'Cơ sở dữ liệu',
        code: 'IT3010',
        credits: 3,
        lecturer: 'TS. Nguyễn Văn A',
        color: '#3b82f6'
      }
    });
  }

  let netSubject = await prisma.subject.findFirst({
    where: { userId: user.id, name: 'Mạng máy tính' }
  });
  if (!netSubject) {
    netSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        semesterId: semester.id,
        name: 'Mạng máy tính',
        code: 'IT3020',
        credits: 3,
        lecturer: 'ThS. Trần Thị B',
        color: '#10b981'
      }
    });
  }

  let seSubject = await prisma.subject.findFirst({
    where: { userId: user.id, name: 'Kiến trúc & Thiết kế Phần mềm' }
  });
  if (!seSubject) {
    seSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        semesterId: semester.id,
        name: 'Kiến trúc & Thiết kế Phần mềm',
        code: 'IT4010',
        credits: 3,
        lecturer: 'PGS. TS. Lê Văn C',
        color: '#8b5cf6'
      }
    });
  }
  console.log('✅ Đã sẵn sàng các môn học: Cơ sở dữ liệu, Mạng máy tính, Kiến trúc Phần mềm');

  // 5. Tạo Đồ án Môn học
  let project = await prisma.project.findFirst({
    where: { userId: user.id, name: 'Đồ án Xây dựng Hệ thống SNOTE' }
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        userId: user.id,
        semesterId: semester.id,
        subjectId: seSubject.id,
        name: 'Đồ án Xây dựng Hệ thống SNOTE',
        description: 'Hệ thống quản lý học tập và ghi chú thông minh cho sinh viên',
        startDate: new Date('2025-10-01'),
        dueDate: new Date('2025-12-25'),
        members: {
          create: [
            { userId: user.id, role: 'OWNER' }
          ]
        }
      }
    });
  }
  console.log(`✅ Đã sẵn sàng đồ án: ${project.name}`);

  console.log('🎉 Hoàn thành nạp dữ liệu mẫu (Seed completed successfully)!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
