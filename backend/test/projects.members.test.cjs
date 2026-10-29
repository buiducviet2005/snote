const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/snote_test';
process.env.JWT_SECRET ||= 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-characters';

const { ProjectsService } = require('../dist/modules/projects/projects.service');
const { ProjectsRepository } = require('../dist/modules/projects/projects.repository');

function project() {
  return {
    id: 'project-a',
    userId: 'owner-a',
    classId: null,
    groupId: null,
    name: 'Dự án',
    description: null,
    semesterId: null,
    subjectId: null,
    status: 'ACTIVE',
    startDate: null,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      { id: 'owner-member', projectId: 'project-a', userId: 'owner-a', role: 'OWNER', status: 'ACCEPTED' },
      { id: 'accepted-member', projectId: 'project-a', userId: 'member-a', role: 'MEMBER', status: 'ACCEPTED' },
      { id: 'pending-member', projectId: 'project-a', userId: 'pending-a', role: 'MEMBER', status: 'PENDING' }
    ]
  };
}

function serviceWith(operations = {}) {
  const row = project();
  const calls = [];
  const repo = {
    findByIdAndUserId: async () => row,
    updateMemberRole: async (...args) => { calls.push(['role', ...args]); return null; },
    removeMember: async (...args) => { calls.push(['remove', ...args]); },
    ...operations
  };
  return { service: new ProjectsService(repo), calls };
}

test('ownership transfer delegates old and new owner to one repository transaction', async () => {
  const { service, calls } = serviceWith();
  await service.updateMemberRole('project-a', 'owner-a', 'member-a', { role: 'OWNER' });
  assert.deepEqual(calls, [['role', 'project-a', 'member-a', 'OWNER', 'owner-a']]);
});

test('pending invite cannot become owner, and current owner cannot demote themselves', async () => {
  const { service, calls } = serviceWith();
  await assert.rejects(
    service.updateMemberRole('project-a', 'owner-a', 'pending-a', { role: 'OWNER' }),
    { code: 'FORBIDDEN' }
  );
  await assert.rejects(
    service.updateMemberRole('project-a', 'owner-a', 'owner-a', { role: 'MEMBER' }),
    { code: 'VALIDATION_ERROR' }
  );
  assert.equal(calls.length, 0);
});

test('admin cannot appoint another admin or remove the owner', async () => {
  const row = project();
  row.members.push({ id: 'admin-member', projectId: 'project-a', userId: 'admin-a', role: 'ADMIN', status: 'ACCEPTED' });
  const { service, calls } = serviceWith({ findByIdAndUserId: async () => row });
  await assert.rejects(
    service.updateMemberRole('project-a', 'admin-a', 'member-a', { role: 'ADMIN' }),
    { code: 'FORBIDDEN' }
  );
  await assert.rejects(
    service.removeMember('project-a', 'admin-a', 'owner-a'),
    { code: 'VALIDATION_ERROR' }
  );
  assert.equal(calls.length, 0);
});

test('project owner cannot leave before transferring ownership', async () => {
  const { service, calls } = serviceWith();
  await assert.rejects(
    service.removeMember('project-a', 'owner-a', 'owner-a'),
    { code: 'VALIDATION_ERROR' }
  );
  assert.equal(calls.length, 0);
});

test('accepting an invitation grants the matching project workspace role in one transaction', async () => {
  const writes = [];
  const tx = {
    projectMember: {
      updateMany: async (args) => { writes.push(['accept', args]); return { count: 1 }; },
      findUniqueOrThrow: async () => ({ role: 'ADMIN' })
    },
    project: { findUnique: async () => ({ workspace: { id: 'workspace-a' } }) },
    workspaceMember: { upsert: async (args) => { writes.push(['workspace', args]); } }
  };
  const repo = new ProjectsRepository({ $transaction: (callback) => callback(tx) });
  const result = await repo.respondToInvitation('project-a', 'member-a', true);
  assert.equal(result.count, 1);
  assert.equal(writes[0][1].data.status, 'ACCEPTED');
  assert.equal(writes[1][1].create.role, 'MANAGER');
  assert.equal(writes[1][1].create.status, 'ACCEPTED');
});

test('owner transfer updates project and workspace owners with both memberships', async () => {
  const writes = [];
  const tx = {
    project: {
      findUniqueOrThrow: async () => ({ workspace: { id: 'workspace-a' } }),
      updateMany: async (args) => { writes.push(['project', args]); return { count: 1 }; }
    },
    projectMember: {
      updateMany: async (args) => { writes.push(['old-project-role', args]); },
      upsert: async (args) => { writes.push(['new-project-role', args]); return { role: 'OWNER' }; }
    },
    workspace: { update: async (args) => { writes.push(['workspace', args]); } },
    workspaceMember: {
      updateMany: async (args) => { writes.push(['old-workspace-role', args]); },
      upsert: async (args) => { writes.push(['new-workspace-role', args]); }
    }
  };
  const repo = new ProjectsRepository({ $transaction: (callback) => callback(tx) });
  await repo.updateMemberRole('project-a', 'member-a', 'OWNER', 'owner-a');
  assert.deepEqual(writes.map(([kind]) => kind), [
    'project', 'old-project-role', 'workspace', 'old-workspace-role', 'new-project-role', 'new-workspace-role'
  ]);
  assert.equal(writes[0][1].data.userId, 'member-a');
  assert.equal(writes[3][1].data.role, 'MEMBER');
  assert.equal(writes[5][1].update.role, 'OWNER');
});

test('removing a member also revokes workspace access and assigned project tasks', async () => {
  const writes = [];
  const tx = {
    project: { findUniqueOrThrow: async () => ({ userId: 'owner-a', workspace: { id: 'workspace-a' } }) },
    taskAssignee: { deleteMany: async (args) => { writes.push(['assignees', args]); } },
    task: { updateMany: async (args) => { writes.push(['tasks', args]); } },
    projectMember: { deleteMany: async (args) => { writes.push(['project-member', args]); } },
    workspaceMember: { deleteMany: async (args) => { writes.push(['workspace-member', args]); } }
  };
  const repo = new ProjectsRepository({ $transaction: (callback) => callback(tx) });
  await repo.removeMember('project-a', 'member-a');
  assert.deepEqual(writes.map(([kind]) => kind), ['assignees', 'tasks', 'project-member', 'workspace-member']);
  assert.equal(writes[1][1].data.userId, 'owner-a');
  assert.equal(writes[3][1].where.userId, 'member-a');
});
