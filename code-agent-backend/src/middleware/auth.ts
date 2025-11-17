import { HttpStatus, IMiddleware } from '@midwayjs/core';
import { Config, Middleware } from '@midwayjs/decorator';
import { Context, NextFunction } from '@midwayjs/web';
import { MidwayHttpError } from '@midwayjs/core';
import axios from 'axios';

const cookieName = 'ymmoa_passport';
const ssoHost = 'https://sso.amh-group.com';

interface User {
  id: string;
  name?: string;
  jobNumber?: string;
}

/**
 * 鉴权验证函数
 * 支持三种鉴权方式:
 * 1. Authorization header 中的 API Token
 * 2. Cookie 中的 ymmoa_passport
 * 3. 本地开发模式 (NODE_ENV=local)
 */
async function authValidate(ctx: Context): Promise<void> {
  let user: User | null = null;

  // 尝试使用 Cookie 鉴权
  if (!user) {
    const userCookie = ctx.cookies.get(cookieName);
    if (userCookie) {
      try {
        const response = await axios.get(`${ssoHost}/sso/verify`, {
          params: {
            passport: '',
          },
          headers: {
            passport: userCookie,
          },
          timeout: 5000,
        });

        if (response.data?.result?.user?.id) {
          user = response.data.result.user as User;
        }
      } catch (error) {
        // SSO 验证失败，继续尝试其他方式
        ctx.logger.warn('SSO验证失败:', error);
      }
    }
  }

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
