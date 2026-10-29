const test = require('node:test');
const assert = require('node:assert/strict');
const { ZodError } = require('zod');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/snote_test';
process.env.JWT_SECRET ||= 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-characters';

const { registerSchema } = require('../dist/modules/auth/auth.schemas');
const { createNoteSchema } = require('../dist/modules/notes/notes.schemas');
const { createScheduleEventSchema } = require('../dist/modules/schedule/schedule.schemas');
const { createTaskSchema } = require('../dist/modules/tasks/tasks.schemas');
const { errorHandler } = require('../dist/shared/middleware/errorHandler');

function messagesFor(result) {
  assert.equal(result.success, false);
  return result.error.issues.map((issue) => issue.message);
}

test('required field messages retain their previous Zod 3 wording', () => {
  assert.ok(messagesFor(registerSchema.safeParse({})).includes('Email là bắt buộc'));
  assert.ok(messagesFor(registerSchema.safeParse({})).includes('Mật khẩu là bắt buộc'));
  assert.ok(messagesFor(registerSchema.safeParse({})).includes('Họ và tên là bắt buộc'));
  assert.ok(messagesFor(createTaskSchema.safeParse({})).includes('Tiêu đề công việc là bắt buộc'));
  assert.ok(messagesFor(createScheduleEventSchema.safeParse({})).includes('Thời gian bắt đầu là bắt buộc'));
  assert.ok(messagesFor(createScheduleEventSchema.safeParse({})).includes('Thời gian kết thúc là bắt buộc'));
});

test('custom enum error mapping remains intact', () => {
  const messages = messagesFor(createNoteSchema.safeParse({
    content: 'Nội dung',
    noteType: 'UNKNOWN'
  }));
  assert.ok(messages.includes('Loại ghi chú không hợp lệ'));
});

test('Zod 4 errors keep the HTTP 400 validation envelope', () => {
  const error = new ZodError([{
    code: 'custom',
    path: ['email'],
    message: 'Email là bắt buộc'
  }]);
  let statusCode = null;
  let body = null;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    }
  };

  errorHandler(error, {
    id: 'req-validation-test',
    path: '/api/auth/register',
    method: 'POST',
    headers: {}
  }, response, () => {});

  assert.equal(statusCode, 400);
  assert.deepEqual(body, {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Email là bắt buộc',
      details: {
        errors: [{
          field: 'email',
          message: 'Email là bắt buộc'
        }]
      }
    }
  });
});
