const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/snote_test';
process.env.JWT_SECRET ||= 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-characters';

const prismaModule = require('../dist/shared/db/prismaClient');
const { TasksService } = require('../dist/modules/tasks/tasks.service');
const { NotesService } = require('../dist/modules/notes/notes.service');
const { createNoteSchema, updateNoteSchema } = require('../dist/modules/notes/notes.schemas');

const groupId = '11111111-1111-4111-8111-111111111111';
const personalId = '22222222-2222-4222-8222-222222222222';

function stubDatabase(t, authorized = true) {
  const original = prismaModule.prisma;
  const captured = { tasks: null, notes: null };
  prismaModule.prisma = {
    workspace: {
      findFirst: async ({ where }) => {
        if (!authorized || where.members.some.userId !== 'student') return null;
        if (where.id === groupId) return { id: groupId, type: 'GROUP', ownerId: 'leader', subjectId: null, projectId: null, groupId: 'group', members: [{ userId: 'student', role: 'MEMBER' }] };
        if (where.id === personalId) return { id: personalId, type: 'PERSONAL', ownerId: 'student', subjectId: null, projectId: null, groupId: null, members: [{ userId: 'student', role: 'OWNER' }] };
        return null;
      }
    },
    task: {
      count: async ({ where }) => { captured.tasks = where; return 0; },
      findMany: async () => []
    },
    note: {
      count: async ({ where }) => { captured.notes = where; return 0; },
      findMany: async () => []
    }
  };
  t.after(() => { prismaModule.prisma = original; });
  return captured;
}

test('group content uses the selected workspace and does not fall back to the owner account', async (t) => {
  const captured = stubDatabase(t);
  await new TasksService().getTasks('student', { workspaceId: groupId });
  await new NotesService().getNotes('student', { workspaceId: groupId });
  assert.equal(captured.tasks.workspaceId, groupId);
  assert.equal(captured.notes.workspaceId, groupId);
  assert.equal('userId' in captured.notes, false);
});

test('personal task rollup includes assigned work while personal notes exclude group notes', async (t) => {
  const captured = stubDatabase(t);
  await new TasksService().getTasks('student', { workspaceId: personalId });
  await new NotesService().getNotes('student', { workspaceId: personalId });
  assert.deepEqual(captured.tasks.AND.at(-1), { OR: [{ userId: 'student' }, { assignees: { some: { userId: 'student' } } }] });
  assert.deepEqual(captured.notes.OR, [{ workspaceId: null }, { workspace: { type: 'PERSONAL' } }]);
});

test('a user without accepted workspace membership cannot read its content', async (t) => {
  stubDatabase(t, false);
  await assert.rejects(new TasksService().getTasks('student', { workspaceId: groupId }), { statusCode: 404 });
  await assert.rejects(new NotesService().getNotes('student', { workspaceId: groupId }), { statusCode: 404 });
});

test('a new workspace note can start empty and be cleared during editing', () => {
  assert.equal(createNoteSchema.safeParse({ title: 'Ghi chú mới', content: '' }).success, true);
  assert.equal(updateNoteSchema.safeParse({ content: '' }).success, true);
});
