// import { join } from 'path'

export const mongoose = {
  client: {
    uri: 'mongodb://10.13.67.90:27017/fta',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      user: 'ftauser',
      pass: '123456',
    },
  },
}

export const egg = {
  port: 7001,
}

/**
 * 开发环境日志配置 - 更详细的日志输出
 */
export const midwayLogger = {
  default: {
    level: 'debug',
  },
}

/**
 * 开发环境自定义日志配置
 */
export const customLogger = {
  // 业务日志 - 记录所有业务操作
  business: {
    level: 'DEBUG',
  },
  // API 请求日志 - 记录所有API请求详情
  api: {
    level: 'DEBUG',
  },
  // 数据库操作日志 - 记录所有数据库查询和操作
  database: {
    level: 'DEBUG',
  },
  // 错误跟踪日志 - 记录所有错误和警告
  errorTrack: {
    level: 'DEBUG', // 开发环境记录所有级别的错误信息
  },
  // Redis 操作日志
  redis: {
    level: 'DEBUG',
  },
  // Bull 队列操作日志
  queue: {
    level: 'DEBUG',
  },
}
