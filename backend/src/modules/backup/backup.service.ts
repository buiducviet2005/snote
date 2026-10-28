import crypto from 'crypto';
import { prisma } from '../../shared/db/prismaClient';
import { BadRequestError } from '../../shared/errors/appErrors';

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

export interface MarkdownExportItem {
  fileName: string;
  folderPath: string;
  content: string;
}

export class BackupService {
  /**
   * Xuất dữ liệu JSON (Toàn bộ hoặc theo Học kỳ / Môn học)
   */
  async exportUserData(
    userId: string,
    options?: { semesterId?: string; subjectId?: string }
  ): Promise<{ data: UserBackupPayload; checksum: string }> {
    const { semesterId, subjectId } = options || {};

    const [user, semesters, subjects, projects, notes, tasks, tags, scheduleEvents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, timezone: true, createdAt: true }
      }),
      prisma.semester.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(semesterId ? { id: semesterId } : {})
        }
      }),
      prisma.subject.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(semesterId ? { semesterId } : {}),
          ...(subjectId ? { id: subjectId } : {})
        }
      }),
      prisma.project.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(semesterId ? { semesterId } : {}),
          ...(subjectId ? { subjectId } : {})
        }
      }),
      prisma.note.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(subjectId ? { subjectId } : {}),
          ...(semesterId ? { subject: { semesterId } } : {})
        },
        include: {
          subject: { select: { name: true, code: true } },
          noteTags: { include: { tag: true } }
        }
      }),
      prisma.task.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(subjectId ? { subjectId } : {}),
          ...(semesterId ? { subject: { semesterId } } : {})
        },
        include: {
          subject: { select: { name: true, code: true } },
          taskTags: { include: { tag: true } }
        }
      }),
      prisma.tag.findMany({ where: { userId } }),
      prisma.scheduleEvent.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(semesterId ? { semesterId } : {}),
          ...(subjectId ? { subjectId } : {})
        }
      })
    ]);

    const data: UserBackupPayload = {
      exportVersion: 'SNOTE_V2_JSON',
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

  /**
   * Xuất danh sách ghi chú dưới dạng Markdown chuẩn Frontmatter
   */
  async exportMarkdownNotes(
    userId: string,
    options?: { semesterId?: string; subjectId?: string }
  ): Promise<MarkdownExportItem[]> {
    const { semesterId, subjectId } = options || {};

    const notes = await prisma.note.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(subjectId ? { subjectId } : {}),
        ...(semesterId ? { subject: { semesterId } } : {})
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
            semester: { select: { name: true, academicYear: true } }
          }
        },
        noteTags: { include: { tag: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return notes.map((note) => {
      const semesterFolder = note.subject?.semester
        ? `${note.subject.semester.name.replace(/[^a-zA-Z0-9_\-\s]/g, '')}`
        : 'Chung';
      const subjectFolder = note.subject
        ? `${(note.subject.code || 'MON')}_${note.subject.name}`.replace(/[^a-zA-Z0-9_\-\s]/g, '')
        : 'Khong_Phan_Loai';

      const tagList = (note.noteTags || []).map((nt) => nt.tag?.name).filter(Boolean);
      const safeTitle = (note.title || 'Untitled').replace(/[^a-zA-Z0-9_\-\s]/g, '');

      // Markdown with YAML Frontmatter
      const markdownContent = `---
title: "${note.title.replace(/"/g, '\\"')}"
type: "${note.noteType}"
subject: "${note.subject?.name || 'None'}"
semester: "${note.subject?.semester?.name || 'None'}"
tags: [${tagList.map((t) => `"${t}"`).join(', ')}]
created_at: "${note.createdAt.toISOString()}"
updated_at: "${note.updatedAt.toISOString()}"
is_pinned: ${note.isPinned}
---

# ${note.title}

${note.content || ''}
`;

      return {
        fileName: `${safeTitle}.md`,
        folderPath: `${semesterFolder}/${subjectFolder}`,
        content: markdownContent
      };
    });
  }

  /**
   * Khôi phục dữ liệu từ tệp Backup JSON
   */
  async restoreUserData(
    userId: string,
    payload: UserBackupPayload,
    mode: 'MERGE' | 'REPLACE' = 'MERGE'
  ): Promise<{ restoredCounts: Record<string, number> }> {
    if (!payload || !payload.exportVersion) {
      throw new BadRequestError('Tệp sao lưu không hợp lệ hoặc không đúng định dạng SNOTE');
    }

    if (mode === 'REPLACE') {
      throw new BadRequestError(
        'Chế độ Ghi đè (REPLACE) tạm thời bị khóa trong giai đoạn thử nghiệm pilot nhằm phòng ngừa rủi ro mất mát dữ liệu học tập ngoài ý muốn. Vui lòng chọn chế độ Ghép thêm (MERGE).'
      );
    }

    return await prisma.$transaction(async (tx) => {
      const idMap = new Map<string, string>(); // oldId -> newId

      // 1. Restore Semesters
      let restoredSemesters = 0;
      for (const sem of payload.semesters || []) {
        const created = await tx.semester.create({
          data: {
            userId,
            name: sem.name,
            academicYear: sem.academicYear || '2025-2026',
            startDate: sem.startDate ? new Date(sem.startDate) : undefined,
            endDate: sem.endDate ? new Date(sem.endDate) : undefined,
            status: sem.status || 'ACTIVE',
            isCurrent: Boolean(sem.isCurrent)
          }
        });
        idMap.set(sem.id, created.id);
        restoredSemesters++;
      }

      // 2. Restore Subjects
      let restoredSubjects = 0;
      for (const sub of payload.subjects || []) {
        const mappedSemesterId = sub.semesterId ? idMap.get(sub.semesterId) : undefined;
        if (mappedSemesterId) {
          const created = await tx.subject.create({
            data: {
              userId,
              semesterId: mappedSemesterId,
              name: sub.name,
              code: sub.code,
              credits: sub.credits || 3,
              lecturer: sub.lecturer,
              color: sub.color || '#3b82f6',
              status: sub.status || 'ACTIVE'
            }
          });
          idMap.set(sub.id, created.id);
          restoredSubjects++;
        }
      }

      // 3. Restore Tags
      for (const t of payload.tags || []) {
        const existing = await tx.tag.findFirst({ where: { userId, name: t.name } });
        if (!existing) {
          const created = await tx.tag.create({
            data: { userId, name: t.name, color: t.color || '#64748b' }
          });
          idMap.set(t.id, created.id);
        } else {
          idMap.set(t.id, existing.id);
        }
      }

      // 4. Restore Projects
      let restoredProjects = 0;
      for (const proj of payload.projects || []) {
        const mappedSemesterId = proj.semesterId ? idMap.get(proj.semesterId) : undefined;
        const mappedSubjectId = proj.subjectId ? idMap.get(proj.subjectId) : undefined;

        const created = await tx.project.create({
          data: {
            userId,
            semesterId: mappedSemesterId,
            subjectId: mappedSubjectId,
            name: proj.name,
            description: proj.description,
            status: proj.status || 'ACTIVE',
            startDate: proj.startDate ? new Date(proj.startDate) : undefined,
            dueDate: proj.dueDate ? new Date(proj.dueDate) : undefined
          }
        });
        idMap.set(proj.id, created.id);
        restoredProjects++;
      }

      // 5. Restore Notes
      let restoredNotes = 0;
      for (const n of payload.notes || []) {
        const mappedSubjectId = n.subjectId ? idMap.get(n.subjectId) : undefined;
        const mappedProjectId = n.projectId ? idMap.get(n.projectId) : undefined;

        const created = await tx.note.create({
          data: {
            userId,
            subjectId: mappedSubjectId,
            projectId: mappedProjectId,
            title: n.title,
            content: n.content || '',
            noteType: n.noteType || 'LECTURE',
            isPinned: Boolean(n.isPinned),
            isArchived: Boolean(n.isArchived)
          }
        });
        idMap.set(n.id, created.id);
        restoredNotes++;
      }

      // 6. Restore Tasks
      let restoredTasks = 0;
      for (const t of payload.tasks || []) {
        const mappedSubjectId = t.subjectId ? idMap.get(t.subjectId) : undefined;
        const mappedProjectId = t.projectId ? idMap.get(t.projectId) : undefined;

        const created = await tx.task.create({
          data: {
            userId,
            subjectId: mappedSubjectId,
            projectId: mappedProjectId,
            title: t.title,
            description: t.description,
            status: t.status || 'TODO',
            priority: t.priority || 'MEDIUM',
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined
          }
        });
        idMap.set(t.id, created.id);
        restoredTasks++;
      }

      // 7. Restore Schedule Events
      let restoredEvents = 0;
      for (const ev of payload.scheduleEvents || []) {
        const mappedSemesterId = ev.semesterId ? idMap.get(ev.semesterId) : undefined;
        const mappedSubjectId = ev.subjectId ? idMap.get(ev.subjectId) : undefined;

        await tx.scheduleEvent.create({
          data: {
            userId,
            semesterId: mappedSemesterId,
            subjectId: mappedSubjectId,
            title: ev.title,
            location: ev.location,
            eventType: ev.eventType || 'CLASS',
            startTime: new Date(ev.startTime),
            endTime: new Date(ev.endTime),
            isRecurring: Boolean(ev.isRecurring)
          }
        });
        restoredEvents++;
      }

      return {
        restoredCounts: {
          semesters: restoredSemesters,
          subjects: restoredSubjects,
          projects: restoredProjects,
          notes: restoredNotes,
          tasks: restoredTasks,
          scheduleEvents: restoredEvents
        }
      };
    });
  }
}
