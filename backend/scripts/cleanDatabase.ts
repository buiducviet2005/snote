import { prisma } from '../src/shared/db/prismaClient';

async function cleanDatabase() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DATABASE_PURGE) {
    throw new Error('❌ BẢO VỆ AN TOÀN: Không thể chạy xóa trắng database trên Production mà không có cờ ALLOW_DATABASE_PURGE=true');
  }

  console.log('🧹 Đang tiến hành dọn sạch toàn bộ dữ liệu mẫu trong cơ sở dữ liệu...');

  await prisma.$transaction(async (tx) => {
    await tx.resourceShare.deleteMany({});
    await tx.noteTag.deleteMany({});
    await tx.taskTag.deleteMany({});
    await tx.taskNoteLink.deleteMany({});
    await tx.taskAssignee.deleteMany({});
    await tx.note.deleteMany({});
    await tx.task.deleteMany({});
    await tx.scheduleEvent.deleteMany({});
    await tx.projectMember.deleteMany({});
    await tx.project.deleteMany({});
    await tx.courseClass.deleteMany({});
    await tx.classMember.deleteMany({});
    await tx.studyGroup.deleteMany({});
    await tx.subject.deleteMany({});
    await tx.semester.deleteMany({});
    await tx.tag.deleteMany({});
    await tx.backupRecord.deleteMany({});
    await tx.refreshToken.deleteMany({});
    await tx.user.deleteMany({});
  });

  console.log('✨ Đã dọn sạch 100% dữ liệu trong database. Cơ sở dữ liệu hiện tại hoàn toàn trắng.');
}

cleanDatabase()
  .catch((err) => {
    console.error('Lỗi dọn sạch database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
