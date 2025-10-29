import { ILogger } from '@midwayjs/core'
import { Provide, Scope, ScopeEnum, Logger } from '@midwayjs/decorator'

/**
 * 日志使用示例和工具类
 * 展示如何在项目中正确使用日志
 */
@Provide()
@Scope(ScopeEnum.Request)
export class LoggerService {
  // 注入默认日志器
  @Logger()
  baseLogger: ILogger

  // 注入自定义业务日志器
  @Logger('business')
  businessLogger: ILogger

  // 注入API日志器
  @Logger('api')
  apiLogger: ILogger

  // 注入数据库日志器
  @Logger('database')
  databaseLogger: ILogger

  // 注入错误跟踪日志器
  @Logger('errorTrack')
  errorLogger: ILogger

  /**
   * 记录用户操作日志
   */
  logUserAction(userId: string, action: string, details?: any) {
    this.businessLogger.info(`[用户操作] 用户ID: ${userId}, 操作: ${action}`, {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      type: 'USER_ACTION',
    })
  }

  /**
   * 记录API请求日志
   */
  logApiRequest(method: string, url: string, params?: any, userId?: string) {
    this.apiLogger.info(`[API请求] ${method} ${url}`, {
      method,
      url,
      params,
      userId,
      timestamp: new Date().toISOString(),
      type: 'API_REQUEST',
    })
  }

  /**
   * 记录API响应日志
   */
  logApiResponse(method: string, url: string, statusCode: number, responseTime: number, userId?: string) {
    this.apiLogger.info(`[API响应] ${method} ${url} - ${statusCode} (${responseTime}ms)`, {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      timestamp: new Date().toISOString(),
      type: 'API_RESPONSE',
    })
  }

  /**
   * 记录数据库操作日志
   */
  logDatabaseOperation(operation: string, collection: string, query?: any, result?: any) {
    this.databaseLogger.debug(`[数据库操作] ${operation} on ${collection}`, {
      operation,
      collection,
      query,
      resultCount: result?.length || 0,
      timestamp: new Date().toISOString(),
      type: 'DATABASE_OPERATION',
    })
  }

  /**
   * 记录业务错误日志
   */
  logBusinessError(error: Error, context: string, userId?: string) {
    this.errorLogger.error(`[业务错误] ${context}: ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      userId,
      timestamp: new Date().toISOString(),
      type: 'BUSINESS_ERROR',
    })
  }

  /**
   * 记录系统警告日志
   */
  logSystemWarning(message: string, details?: any) {
    this.errorLogger.warn(`[系统警告] ${message}`, {
      message,
      details,
      timestamp: new Date().toISOString(),
      type: 'SYSTEM_WARNING',
    })
  }

  /**
   * 记录性能指标日志
   */
  logPerformance(operation: string, duration: number, details?: any) {
    this.businessLogger.info(`[性能指标] ${operation} 耗时: ${duration}ms`, {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
      type: 'PERFORMANCE_METRIC',
    })
  }

  /**
   * 记录Redis操作日志
   */
  logRedisOperation(operation: string, key: string, result?: any) {
    // 使用默认日志器记录Redis操作
    this.baseLogger.debug(`[Redis操作] ${operation} ${key}`, {
      operation,
      key,
      result,
      timestamp: new Date().toISOString(),
      type: 'REDIS_OPERATION',
    })
  }

  /**
   * 记录队列任务日志
   */
  logQueueTask(queueName: string, taskId: string, status: string, details?: any) {
    // 使用默认日志器记录队列任务
    this.baseLogger.info(`[队列任务] ${queueName} - ${taskId} (${status})`, {
      queueName,
      taskId,
      status,
      details,
      timestamp: new Date().toISOString(),
      type: 'QUEUE_TASK',
    })
  }
}

/**
 * 使用示例的控制器
 */
import { Controller, Get, Post, Inject } from '@midwayjs/decorator'

@Controller('/example')
export class ExampleController {
  @Inject()
  loggerService: LoggerService

  @Get('/log-demo')
  async logDemo() {
    const userId = 'user123'

    // 记录API请求
    this.loggerService.logApiRequest('GET', '/example/log-demo', {}, userId)

    // 记录用户操作
    this.loggerService.logUserAction(userId, '访问日志演示页面', { section: 'logging' })

    // 记录性能指标
    const startTime = Date.now()

    try {
      // 模拟一些业务逻辑
      await this.simulateBusinessLogic()

      const duration = Date.now() - startTime
      this.loggerService.logPerformance('业务逻辑处理', duration)

      return { message: '日志演示成功', logs: '请查看控制台和日志文件' }
    } catch (error) {
      this.loggerService.logBusinessError(error as Error, '日志演示业务逻辑', userId)
      throw error
    } finally {
      // 记录API响应
      this.loggerService.logApiResponse('GET', '/example/log-demo', 200, Date.now() - startTime, userId)
    }
  }

  private async simulateBusinessLogic(): Promise<void> {
    // 模拟数据库操作
    this.loggerService.logDatabaseOperation('find', 'users', { id: 'user123' }, [{ id: 'user123', name: 'Test User' }])

    // 模拟Redis操作
    this.loggerService.logRedisOperation('get', 'user:cache:user123', { name: 'Test User' })

    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

/**
 * 中间件示例 - 自动记录API请求日志
 */
import { Context, NextFunction } from '@midwayjs/web'

export async function loggingMiddleware(ctx: Context, next: NextFunction) {
  const startTime = Date.now()
  const loggerService = await ctx.requestContext.getAsync(LoggerService)

  // 记录请求开始
  loggerService.logApiRequest(
    ctx.method,
    ctx.path,
    {
      query: ctx.query,
      body: ctx.request.body,
      headers: ctx.headers,
      ip: ctx.ip,
    },
    ctx.user?.id
  )

  try {
    await next()

    // 记录响应
    const duration = Date.now() - startTime
    loggerService.logApiResponse(ctx.method, ctx.path, ctx.status, duration, ctx.user?.id)

    // 如果响应时间过长，记录警告
    if (duration > 1000) {
      loggerService.logSystemWarning(`慢请求检测: ${ctx.method} ${ctx.path}`, {
        duration,
        threshold: 1000,
      })
    }
  } catch (error) {
    // 记录错误
    loggerService.logBusinessError(error as Error, `API请求处理失败: ${ctx.method} ${ctx.path}`, ctx.user?.id)
    throw error
  }
}
