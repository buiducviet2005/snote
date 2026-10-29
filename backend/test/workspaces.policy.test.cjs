const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canPerformWorkspaceAction,
  isValidTimeZone,
  workspaceMemberAccessWhere,
  workspacePermissions
} = require('../dist/modules/workspaces/workspaces.policy');
const {
  createWorkspaceSchema,
  listWorkspacesSchema
} = require('../dist/modules/workspaces/workspaces.schemas');

test('workspace role matrix grants mutations only to owner and manager', () => {
  assert.ok(workspacePermissions('OWNER', 'ACTIVE').includes('workspace.archive'));
  assert.ok(workspacePermissions('MANAGER', 'ACTIVE').includes('member.invite'));
  assert.equal(workspacePermissions('MEMBER', 'ACTIVE').includes('workspace.update'), false);
  assert.equal(workspacePermissions('VIEWER', 'ACTIVE').includes('member.manage'), false);
});

test('archived workspaces reject every mutation except owner reopen', () => {
  assert.equal(canPerformWorkspaceAction('OWNER', 'ARCHIVED', 'workspace.reopen'), true);
  assert.equal(canPerformWorkspaceAction('MANAGER', 'ARCHIVED', 'workspace.update'), false);
  assert.equal(canPerformWorkspaceAction('MANAGER', 'ARCHIVED', 'member.invite'), false);
  assert.equal(canPerformWorkspaceAction('MEMBER', 'ARCHIVED', 'workspace.read'), true);
});

test('workspace access predicate requires one accepted active membership', () => {
  assert.deepEqual(workspaceMemberAccessWhere('workspace-a', 'user-a'), {
    id: 'workspace-a',
    deletedAt: null,
    members: {
      some: {
        userId: 'user-a',
        status: 'ACCEPTED',
        user: {
          status: 'ACTIVE',
          deletedAt: null
        }
      }
    }
  });
});

test('workspace request validation rejects mixed or unsupported shapes', () => {
  assert.equal(createWorkspaceSchema.safeParse({
    type: 'PERSONAL',
    name: 'Cá nhân',
    subject: { subjectId: '11111111-1111-4111-8111-111111111111' }
  }).success, false);
  assert.equal(createWorkspaceSchema.safeParse({
    type: 'PROJECT',
    name: 'Đồ án',
    project: { startDate: '2026-02-31' }
  }).success, false);
  assert.equal(listWorkspacesSchema.safeParse({ limit: '101' }).success, false);
});

test('timezone validation accepts IANA zones and rejects arbitrary offsets', () => {
  assert.equal(isValidTimeZone('Asia/Bangkok'), true);
  assert.equal(isValidTimeZone('Asia/Invalid_Zone'), false);
  assert.equal(isValidTimeZone('UTC+7'), false);
});

test('workspace policy differentiates between SUBJECT (classroom) and PROJECT (team)', () => {
  // In a Classroom (SUBJECT): Student MEMBER cannot create class tasks
  assert.equal(canPerformWorkspaceAction('MEMBER', 'ACTIVE', 'task.create', 'SUBJECT'), false);
  assert.equal(canPerformWorkspaceAction('MEMBER', 'ACTIVE', 'task.submit', 'SUBJECT'), true);
  assert.equal(canPerformWorkspaceAction('MEMBER', 'ACTIVE', 'note.create', 'SUBJECT'), true);

  // In a Project (PROJECT): Team MEMBER can create tasks, update their assigned tasks, and write docs
  assert.equal(canPerformWorkspaceAction('MEMBER', 'ACTIVE', 'task.create', 'PROJECT'), true);
  assert.equal(canPerformWorkspaceAction('MEMBER', 'ACTIVE', 'task.update.assigned', 'PROJECT'), true);
});
