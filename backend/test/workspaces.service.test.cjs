const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/snote_test';
process.env.JWT_SECRET ||= 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-characters';

const { WorkspacesService } = require('../dist/modules/workspaces/workspaces.service');

function createRepo(overrides = {}) {
  return {
    findUserTimezone: async () => 'Asia/Bangkok',
    findPersonalWorkspace: async () => null,
    findSubjectWorkspace: async () => null,
    findOwnedSubject: async () => null,
    findOwnedSemester: async () => null,
    findAcceptedContext: async () => null,
    listAcceptedWorkspaces: async () => [],
    listAcceptedMembers: async () => [],
    createPersonal: async () => null,
    createSubject: async () => null,
    createProject: async () => null,
    ...overrides
  };
}

function acceptedContext(role = 'OWNER', status = 'ACTIVE') {
  return {
    id: 'workspace-a',
    type: 'PROJECT',
    name: 'Đồ án',
    ownerId: 'owner-a',
    status,
    timezone: 'Asia/Bangkok',
    version: 1,
    subjectId: null,
    projectId: 'project-a',
    createdAt: new Date('2026-10-28T00:00:00.000Z'),
    updatedAt: new Date('2026-10-28T00:00:00.000Z'),
    deletedAt: null,
    project: {
      id: 'project-a',
      semesterId: null,
      subjectId: null,
      description: null,
      status: 'ACTIVE',
      startDate: null,
      dueDate: null
    },
    subject: null,
    members: [{
      id: 'member-a',
      workspaceId: 'workspace-a',
      userId: 'user-a',
      role,
      status: 'ACCEPTED',
      version: 1,
      joinedAt: new Date('2026-10-28T00:00:00.000Z'),
      user: {
        id: 'user-a',
        fullName: 'Người dùng A',
        avatarUrl: null
      }
    }]
  };
}

test('context returns 404 for another user workspace and never maps cross-account data', async () => {
  const service = new WorkspacesService(createRepo({
    findAcceptedContext: async (workspaceId, userId) =>
      workspaceId === 'workspace-a' && userId === 'user-a' ? acceptedContext() : null
  }));

  await assert.rejects(service.getContext('workspace-a', 'user-b'), {
    code: 'NOT_FOUND',
    statusCode: 404
  });
  const context = await service.getContext('workspace-a', 'user-a');
  assert.equal(context.workspace.id, 'workspace-a');
  assert.equal(context.membership.userId, 'user-a');
});

test('archived context grants owner only read actions and reopen', async () => {
  const service = new WorkspacesService(createRepo({
    findAcceptedContext: async () => acceptedContext('OWNER', 'ARCHIVED')
  }));
  const context = await service.getContext('workspace-a', 'user-a');
  assert.deepEqual(context.effectivePermissions, [
    'workspace.read',
    'member.read',
    'workspace.reopen'
  ]);
});

test('second personal workspace is rejected before repository creation', async () => {
  const service = new WorkspacesService(createRepo({
    findPersonalWorkspace: async () => ({ id: 'existing-workspace' })
  }));
  await assert.rejects(service.create('user-a', {
    type: 'PERSONAL',
    name: 'Cá nhân'
  }), {
    code: 'CONFLICT',
    statusCode: 409
  });
});

test('concurrent unique workspace creation is mapped to a stable conflict', async () => {
  const service = new WorkspacesService(createRepo({
    createPersonal: async () => {
      throw Object.assign(new Error('unique'), { code: 'P2002' });
    }
  }));
  await assert.rejects(service.create('user-a', {
    type: 'PERSONAL',
    name: 'Cá nhân'
  }), {
    code: 'CONFLICT',
    statusCode: 409
  });
});

test('project workspace rejects an invalid date range before creating rows', async () => {
  const service = new WorkspacesService(createRepo());
  await assert.rejects(service.create('user-a', {
    type: 'PROJECT',
    name: 'Đồ án',
    project: {
      startDate: '2026-11-02',
      dueDate: '2026-11-01'
    }
  }), {
    code: 'VALIDATION_ERROR',
    statusCode: 400
  });
});
