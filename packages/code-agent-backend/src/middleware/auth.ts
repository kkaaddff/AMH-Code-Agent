import { HttpStatus, IMiddleware } from '@midwayjs/core';
import { Config, Middleware } from '@midwayjs/decorator';
import { Context, NextFunction } from '@midwayjs/web';
import { MidwayHttpError } from '@midwayjs/core';
import axios from 'axios';

interface User {
  id: string;
  name?: string;
  jobNumber?: string;
}

interface AuthConfig {
  cookieName: string;
  ssoHost: string;
}

/**
 * 根据环境变量获取鉴权配置
 */
function getAuthConfig(): AuthConfig {
  const hostname = process.env.HOSTNAME || '';
  const isDev = hostname.includes('dev');
  const isQa = hostname.includes('qa');

  if (isDev) {
    return {
      cookieName: 'dev_passport',
      ssoHost: 'https://dev-sso.amh-group.com',
    };
  }

  if (isQa) {
    return {
      cookieName: 'qa_passport',
      ssoHost: 'https://qa-sso.amh-group.com',
    };
  }

  // 生产环境
  return {
    cookieName: 'ymmoa_passport',
    ssoHost: 'https://sso.amh-group.com',
  };
}

/**
 * 从 X-User-Cookies header 中提取 cookie 值
 */
function getCookieFromHeader(ctx: Context, cookieName: string): string | null {
  const userCookiesHeader = ctx.get('x-user-cookies');
  if (!userCookiesHeader) {
    return null;
  }

  try {
    const cookies = JSON.parse(userCookiesHeader);
    return cookies[cookieName] || cookies.ymmoa_online || null;
  } catch (error) {
    ctx.logger.warn('解析 X-User-Cookies header 失败:', error);
    return null;
  }
}

/**
 * 从 Cookie 中获取 cookie 值
 */
function getCookieFromRequest(ctx: Context, cookieName: string): string | null {
  return ctx.cookies.get(cookieName) || null;
}

/**
 * 通过 SSO 验证用户身份
 */
async function verifyUserBySSO(ctx: Context, passport: string, ssoHost: string): Promise<User | null> {
  try {
    const response = await axios.get(`${ssoHost}/sso/verify`, {
      params: {
        passport: '',
      },
      headers: {
        passport,
      },
      timeout: 5000,
    });

    if (response.data?.result?.user?.id) {
      return response.data.result.user as User;
    }
    return null;
  } catch (error) {
    ctx.logger.warn('SSO 验证失败:', error);
    return null;
  }
}

/**
 * 尝试从指定来源获取并验证用户
 */
async function tryAuthFromSource(
  ctx: Context,
  passport: string | null,
  ssoHost: string,
  sourceName: string
): Promise<User | null> {
  if (!passport) {
    return null;
  }

  const user = await verifyUserBySSO(ctx, passport, ssoHost);
  if (!user) {
    ctx.logger.warn(`${sourceName} 验证失败`);
  }
  return user;
}

/**
 * 鉴权验证函数
 * 支持四种鉴权方式:
 * 1. X-User-Cookies header 中的 cookies JSON
 * 2. Authorization header 中的 API Token
 * 3. Cookie 中的 ymmoa_passport
 * 4. 本地开发模式 (NODE_ENV=local)
 */
async function authValidate(ctx: Context): Promise<void> {
  const authConfig = getAuthConfig();
  let user: User | null = null;

  // 尝试从自定义 header 获取 cookies
  // if (!user) {
  //   const passport = getCookieFromHeader(ctx, authConfig.cookieName);
  //   user = await tryAuthFromSource(ctx, passport, authConfig.ssoHost, '自定义 header');
  // }

  // // 尝试使用 Cookie 鉴权
  // if (!user) {
  //   const passport = getCookieFromRequest(ctx, authConfig.cookieName);
  //   user = await tryAuthFromSource(ctx, passport, authConfig.ssoHost, 'Cookie');
  // }

  // 本地开发模式
  if (!user && process.env.NODE_ENV === 'local') {
    user = {
      id: '1048906',
      jobNumber: '1000000',
      name: '测试用户',
    };
  }

  // 验证用户信息
  if (!user || !user.id) {
    throw new Error('Unauthorized');
  }

  // 将用户信息设置到 context 中
  ctx.state.user = user;

  // 设置用户 ID 到 headers 中，供下游使用
  ctx.set('user-id', user.id);
}

@Middleware()
export class AuthMiddleware implements IMiddleware<Context, NextFunction> {
  @Config('authMiddleware')
  authConfig: { match: RegExp[] | null };

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 控制器前执行的逻辑
      try {
        await authValidate(ctx);
      } catch (error: any) {
        throw new MidwayHttpError(error?.message ?? 'Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      // 执行下一个 Web 中间件
      const result = await next();
      return result;
    };
  }

  match(ctx: Context) {
    // 如果没有配置匹配规则，则不启用中间件
    if (!this.authConfig.match || !Array.isArray(this.authConfig.match)) {
      return false;
    }
    // 只要有一个规则命中则启用
    return this.authConfig.match.some((reg) => reg.test(ctx.path));
  }

  static getName(): string {
    return 'auth-middleware';
  }
}
