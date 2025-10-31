import AgentScheduler, { generateUID } from './index';

/**
 * 示例：多会话并行执行
 */
export async function runMultipleSessionsExample(): Promise<void> {
  const scheduler = new AgentScheduler();

  const prompts = ['创建一个用户详情页面', '创建一个订单列表页面', '创建一个商品展示页面'];

  const sessions = prompts.map((prompt) => {
    const uid = generateUID();
    scheduler.createSession(uid, prompt);
    return uid;
  });

  console.log(`创建了 ${sessions.length} 个会话`);

  // 并行执行所有会话
  await Promise.all(sessions.map((uid) => scheduler.executeSession(uid)));

  console.log('\n所有会话完成!');

  // 清理所有会话
  sessions.forEach((uid) => scheduler.cleanupSession(uid));
}
