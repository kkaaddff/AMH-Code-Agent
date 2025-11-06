import { commonUserPrompt } from './CommonPrompt';
import { AgentScheduler } from './index.AgentScheduler.backup';
import { formatTodos, generateUID } from './utils';

/**
 * 示例：多会话并行执行
 */
export async function runMultipleSessionsExample(): Promise<void> {
  const scheduler = new AgentScheduler();

  const prompts = ['创建一个用户详情页面', '创建一个订单列表页面', '创建一个商品展示页面'];

  const sessions = prompts.map((prompt) => {
    const uid = generateUID();
    scheduler.createSession(uid, prompt, '');
    return uid;
  });

  console.log(`创建了 ${sessions.length} 个会话`);

  // 并行执行所有会话
  await Promise.all(sessions.map((uid) => scheduler.executeSession(uid)));

  console.log('\n所有会话完成!');

  // 清理所有会话
  sessions.forEach((uid) => scheduler.cleanupSession(uid));
}

// ==================== 使用示例 ====================

/**
 * 示例：创建并执行一个代码生成会话
 */
export async function runCodeGenerationExample(): Promise<void> {
  const scheduler = new AgentScheduler();

  // 创建新会话
  const uid = generateUID();
  const initialPrompt = commonUserPrompt.mainPrompt;

  scheduler.createSession(uid, initialPrompt, '');

  console.log(`创建会话: ${uid}`);
  console.log('初始提示:', initialPrompt);

  try {
    // 执行会话
    await scheduler.executeSession(uid);

    // 获取最终状态
    const finalSession = scheduler.getSession(uid);
    if (finalSession) {
      console.log('\n会话完成!');
      console.log('TODO 列表:');
      console.log(formatTodos(finalSession.todos));
      console.log(`\n消息数量: ${finalSession.messages.length}`);
    }
  } catch (error) {
    console.error('会话执行失败:', error);
  } finally {
    // 清理会话
    scheduler.cleanupSession(uid);
  }
}
