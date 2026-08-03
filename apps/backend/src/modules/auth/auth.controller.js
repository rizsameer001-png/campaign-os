import { sendSuccess } from '../../utils/responseFormatter.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
};

function setRefreshCookie(res, token, rememberMe) {
  res.cookie(REFRESH_COOKIE, token, {
    ...REFRESH_COOKIE_OPTS,
    maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res, next) {
  try {
    const result = await authService.registerCandidate(req.body);
    return sendSuccess(res, { data: result, message: result.message, status: 201 });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const result = await authService.verifyPhoneOtp(req.body.userId, req.body.otp);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function resendOtp(req, res, next) {
  try {
    const result = await authService.resendPhoneOtp(req.body.userId);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.loginCandidate({
      ...req.body,
      req,
    });
    setRefreshCookie(res, refreshToken, req.body.rememberMe);
    return sendSuccess(res, { data: { accessToken, user }, message: 'Login successful' });
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.loginAdmin({ ...req.body, req });
    setRefreshCookie(res, refreshToken, false);
    return sendSuccess(res, { data: { accessToken, user }, message: 'Login successful' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
    const { accessToken, refreshToken, user } = await authService.refreshSession(token, req);
    setRefreshCookie(res, refreshToken, false);
    return sendSuccess(res, { data: { accessToken, user }, message: 'Token refreshed' });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    let refreshTokenId;
    try {
      const { verifyToken } = await import('../../config/jwt.js');
      refreshTokenId = token ? verifyToken(token).jti : undefined;
    } catch {
      // token already invalid/expired — nothing to revoke, still clear cookie
    }
    const result = await authService.logout(refreshTokenId);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return sendSuccess(res, { data: user });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(req, res, next) {
  try {
    const sessions = await authService.listSessions(req.user.id);
    return sendSuccess(res, { data: sessions });
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(req, res, next) {
  try {
    const result = await authService.revokeSession(req.user.id, req.params.id);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}
