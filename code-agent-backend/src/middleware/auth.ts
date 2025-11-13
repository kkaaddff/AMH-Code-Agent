import { HttpStatus, IMiddleware } from '@midwayjs/core';
import { Config, Middleware } from '@midwayjs/decorator';
import { Context, NextFunction } from '@midwayjs/web';
import { MidwayHttpError } from '@midwayjs/core';
import { authValidate } from './sso';

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
    debugger;
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
