const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'development';
process.env.DATABASE_URL ||= 'postgresql://ainote_dev_user:ainote_dev_password_2026@localhost:5432/ainote_dev_db?schema=public';
process.env.JWT_SECRET ||= 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-characters';

const { AuthService } = require('../dist/modules/auth/auth.service');

function createAuthRepo(overrides = {}) {
  const users = new Map();
  return {
    users,
    findUserByEmail: async (email) => users.get(email.toLowerCase().trim()) || null,
    findUserByGoogleId: async (googleId) => {
      for (const user of users.values()) {
        if (user.googleId === googleId && !user.deletedAt) return user;
      }
      return null;
    },
    findUserById: async (id) => {
      for (const user of users.values()) {
        if (user.id === id && !user.deletedAt) return user;
      }
      return null;
    },
    createUser: async (data) => {
      const user = {
        id: 'user-' + Math.random().toString(36).slice(2, 8),
        email: data.email,
        passwordHash: data.passwordHash,
        googleId: null,
        fullName: data.fullName,
        avatarUrl: null,
        timezone: data.timezone || 'Asia/Ho_Chi_Minh',
        role: data.role || 'STUDENT',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      users.set(user.email, user);
      return user;
    },
    createGoogleUser: async (data) => {
      const user = {
        id: 'google-user-' + Math.random().toString(36).slice(2, 8),
        email: data.email,
        passwordHash: null,
        googleId: data.googleId,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl || null,
        timezone: data.timezone || 'Asia/Ho_Chi_Minh',
        role: 'STUDENT',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      users.set(user.email, user);
      return user;
    },
    linkGoogleAccount: async (userId, data) => {
      for (const user of users.values()) {
        if (user.id === userId) {
          user.googleId = data.googleId;
          if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
          return user;
        }
      }
      throw new Error('User not found');
    },
    updateUser: async (id, data) => {
      for (const user of users.values()) {
        if (user.id === id) {
          Object.assign(user, data);
          return user;
        }
      }
      throw new Error('User not found');
    },
    saveRefreshToken: async () => {},
    ...overrides
  };
}

test('Google Login creates a new student user when email does not exist', async () => {
  const repo = createAuthRepo();
  const service = new AuthService(repo);

  const res = await service.loginWithGoogle({
    accessToken: 'dev-mock-google-token',
    devEmail: 'student.new@snote.edu.vn'
  });

  assert.ok(res.authResponse.accessToken);
  assert.ok(res.refreshToken);
  assert.equal(res.authResponse.user.email, 'student.new@snote.edu.vn');
  assert.equal(res.authResponse.user.fullName, 'student.new');
  assert.equal(res.authResponse.user.role, 'STUDENT');

  const savedUser = await repo.findUserByEmail('student.new@snote.edu.vn');
  assert.ok(savedUser);
  assert.ok(savedUser.googleId.startsWith('google_dev_'));
  assert.equal(savedUser.passwordHash, null);
});

test('Google Login links googleId to existing password user and preserves credentials', async () => {
  const repo = createAuthRepo();
  // Pre-seed user with password
  await repo.createUser({
    email: 'existing.student@snote.edu.vn',
    passwordHash: '$2a$12$somehashedpassword',
    fullName: 'Sinh Vien Cu'
  });

  const service = new AuthService(repo);
  const res = await service.loginWithGoogle({
    accessToken: 'dev-mock-google-token',
    devEmail: 'existing.student@snote.edu.vn'
  });

  assert.equal(res.authResponse.user.email, 'existing.student@snote.edu.vn');
  const user = await repo.findUserByEmail('existing.student@snote.edu.vn');
  assert.ok(user.googleId.startsWith('google_dev_'));
  assert.equal(user.passwordHash, '$2a$12$somehashedpassword');
  assert.ok(user.avatarUrl);
});

test('Google Login rejects suspended accounts', async () => {
  const repo = createAuthRepo();
  const user = await repo.createGoogleUser({
    email: 'suspended.user@snote.edu.vn',
    fullName: 'Locked User',
    googleId: 'google_suspended_123'
  });
  user.status = 'SUSPENDED';

  const service = new AuthService(repo);
  await assert.rejects(
    async () => {
      await service.loginWithGoogle({
        accessToken: 'dev-mock-google-token',
        devEmail: 'suspended.user@snote.edu.vn'
      });
    },
    /tài khoản của bạn đã bị tạm khóa/i
  );
});

test('Google Login fails when neither credential nor accessToken is provided', async () => {
  const repo = createAuthRepo();
  const service = new AuthService(repo);

  await assert.rejects(
    async () => {
      await service.loginWithGoogle({});
    },
    /không thể trích xuất địa chỉ email/i
  );
});
