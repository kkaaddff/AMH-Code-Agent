import { Context } from '@midwayjs/web';
import axios from 'axios';

const cookieName = 'ymmoa_passport';
const ssoHost = 'https://sso.amh-group.com';

export interface User {
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
export async function authValidate(ctx: Context): Promise<void> {
  let user: User | null = null;
  // 本地开发模式
  if (!user && process.env.NODE_ENV === 'local') {
    user = {
      id: '1048906',
      jobNumber: '1000000',
      name: '测试用户',
    };
  }
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

  // 验证用户信息
  if (!user || !user.id) {
    throw new Error('Unauthorized');
  }

  // 将用户信息设置到 context 中
  ctx.state.user = user;

  // 设置用户 ID 到 headers 中，供下游使用
  ctx.set('ai-user-id', user.id);
}
