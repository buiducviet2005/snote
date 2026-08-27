import { prisma } from '../src/shared/db/prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seeding SNOTE database)...');

  // 1. Tạo User sinh viên mẫu
  const passwordHash = await bcrypt.hash('Sinhvien@2026', 12);
  const user = await prisma.user.upsert({
    where: { email: 'sinhvien@snote.edu.vn' },
    update: {},
    create: {
      email: 'sinhvien@snote.edu.vn',
      fullName: 'Nguyễn Văn Sinh Viên',
      passwordHash,
      timezone: 'Asia/Ho_Chi_Minh'
    }
  });
  console.log(`✅ Đã tạo user mẫu: ${user.email} (${user.id})`);

  // 2. Tạo Học kỳ mẫu
  const semester = await prisma.semester.create({
    data: {
      userId: user.id,
      name: 'Học kỳ 1 (2025 - 2026)',
      academicYear: '2025-2026',
      isCurrent: true,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15')
    }
  });
  console.log(`✅ Đã tạo học kỳ: ${semester.name}`);

  // 3. Tạo Các Môn học
  const dbSubject = await prisma.subject.create({
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

  const netSubject = await prisma.subject.create({
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

  const seSubject = await prisma.subject.create({
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
  console.log('✅ Đã tạo 3 môn học: Cơ sở dữ liệu, Mạng máy tính, Kiến trúc Phần mềm');

  // 4. Tạo Đồ án Môn học
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      semesterId: semester.id,
      subjectId: seSubject.id,
      name: 'Đồ án Xây dựng Hệ thống SNOTE',
      description: 'Hệ thống quản lý học tập và ghi chú thông minh cho sinh viên',
      startDate: new Date('2025-10-01'),
      dueDate: new Date('2025-12-25')
    }
  });
  console.log(`✅ Đã tạo đồ án: ${project.name}`);

  // 5. Tạo Thẻ Tags
  const tagDb = await prisma.tag.create({
    data: { userId: user.id, name: 'Database', color: '#3b82f6' }
  });
  const tagArch = await prisma.tag.create({
    data: { userId: user.id, name: 'Architecture', color: '#8b5cf6' }
  });
  const tagExam = await prisma.tag.create({
    data: { userId: user.id, name: 'ExamPrep', color: '#ef4444' }
  });

  // 6. Tạo Ghi chú (Notes - Có gắn subject_id hoặc project_id)
  const note1 = await prisma.note.create({
    data: {
      userId: user.id,
      subjectId: dbSubject.id,
      title: 'Tổng quan về Transaction ACID và Isolation Levels',
      content: 'Bốn tính chất cốt lõi của ACID: Atomicity, Consistency, Isolation, Durability. Ranh giới transaction bảo toàn tính đúng đắn của dữ liệu tài khoản.',
      noteType: 'LECTURE',
      isPinned: true,
      noteTags: {
        create: [{ tagId: tagDb.id }]
      }
    }
  });

  const note2 = await prisma.note.create({
    data: {
      userId: user.id,
      projectId: project.id,
      title: 'Thiết kế Modular Monolith cho SNOTE Backend',
      content: 'Cấu trúc 10 Bounded Contexts độc lập, bọc trong 1 Express process duy nhất và 1 Postgres database instance nhằm tối ưu chi phí và độ phức tạp.',
      noteType: 'PROJECT_LOG',
      noteTags: {
        create: [{ tagId: tagArch.id }]
      }
    }
  });
  console.log(`✅ Đã tạo 2 ghi chú: ${note1.title}, ${note2.title}`);

  // 7. Tạo Công việc (Tasks - Có gắn subject_id hoặc project_id)
  await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: dbSubject.id,
      title: 'Hoàn thành bài tập thiết kế ERD tuần 3',
      description: 'Vẽ sơ đồ ERD cho hệ thống quản lý thư viện trường đại học',
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: new Date('2025-10-15')
    }
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      projectId: project.id,
      title: 'Cài đặt JWT Authentication và AuthGuard bảo vệ IDOR',
      description: 'Access Token 15 phút + Refresh Token Cookie httpOnly',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2025-11-20')
    }
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: netSubject.id,
      title: 'Ôn tập thi giữa kỳ môn Mạng máy tính',
      description: 'Ôn tập các tầng OSI, TCP 3-way handshake, Subnetting IPv4',
      status: 'TODO',
      priority: 'URGENT',
      dueDate: new Date('2025-11-10')
    }
  });
  console.log('✅ Đã tạo 3 công việc (Tasks)');

  // 8. Tạo Sự kiện Lịch trình (Schedule Events)
  await prisma.scheduleEvent.create({
    data: {
      userId: user.id,
      semesterId: semester.id,
      subjectId: dbSubject.id,
      title: 'Học Cơ sở dữ liệu (Phòng A2-301)',
      location: 'Tòa nhà A2, Phòng 301',
      eventType: 'CLASS',
      startTime: new Date('2025-10-06T07:00:00Z'),
      endTime: new Date('2025-10-06T09:30:00Z'),
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO'
    }
  });

  await prisma.scheduleEvent.create({
    data: {
      userId: user.id,
      semesterId: semester.id,
      subjectId: netSubject.id,
      title: 'Học Mạng máy tính (Phòng B1-204)',
      location: 'Tòa nhà B1, Phòng 204',
      eventType: 'CLASS',
      startTime: new Date('2025-10-08T09:45:00Z'),
      endTime: new Date('2025-10-08T11:45:00Z'),
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=WE'
    }
  });
  console.log('✅ Đã tạo 2 sự kiện lịch học mẫu');

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
