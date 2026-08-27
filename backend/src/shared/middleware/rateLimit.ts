import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter siết chặt cho các Endpoint xác thực (Login, Register).
 * Giới hạn: Tối đa 10 requests / 15 phút.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 15 phút.'
    }
  }
});

/**
 * Rate Limiter toàn cục cho toàn bộ API routes (`/api/*`).
 * Giới hạn: Tối đa 100 requests / 1 phút.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Tần suất gửi yêu cầu quá cao. Vui lòng giảm tốc độ thao tác.'
    }
  }
});
