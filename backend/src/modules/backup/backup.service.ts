import crypto from 'crypto';
import { prisma } from '../../shared/db/prismaClient';

export interface UserBackupPayload {
  exportVersion: string;
  exportedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    timezone: string;
    createdAt: Date;
  };
  semesters: any[];
  subjects: any[];
  projects: any[];
  notes: any[];
  tasks: any[];
  tags: any[];
  scheduleEvents: any[];
}

export class BackupService {
  async exportUserData(userId: string): Promise<{ data: UserBackupPayload; checksum: string }> {
    const [user, semesters, subjects, projects, notes, tasks, tags, scheduleEvents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, timezone: true, createdAt: true }
      }),
      prisma.semester.findMany({ where: { userId, deletedAt: null } }),
      prisma.subject.findMany({ where: { userId, deletedAt: null } }),
      prisma.project.findMany({ where: { userId, deletedAt: null } }),
      prisma.note.findMany({
        where: { userId, deletedAt: null },
        include: {
          noteTags: {
            include: { tag: true }
          }
        }
      }),
      prisma.task.findMany({
        where: { userId, deletedAt: null },
        include: {
          taskTags: {
            include: { tag: true }
          }
        }
      }),
      prisma.tag.findMany({ where: { userId } }),
      prisma.scheduleEvent.findMany({ where: { userId, deletedAt: null } })
    ]);

    const data: UserBackupPayload = {
      exportVersion: 'SNOTE_V1_JSON',
      exportedAt: new Date().toISOString(),
      user: user as any,
      semesters,
      subjects,
      projects,
      notes,
      tasks,
      tags,
      scheduleEvents
    };

    const serialized = JSON.stringify(data);
    const checksum = crypto.createHash('sha256').update(serialized).digest('hex');

    // Lưu lại log backup
    await prisma.backupRecord.create({
      data: {
        userId,
        fileName: `snote_backup_${userId}_${Date.now()}.json`,
        fileSize: Buffer.byteLength(serialized),
        checksum
      }
    });

    return { data, checksum };
  }
}
