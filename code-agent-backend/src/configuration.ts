import { ILifeCycle, IMidwayContainer } from '@midwayjs/core';
import { App, Configuration } from '@midwayjs/decorator';
import { Application } from '@midwayjs/web';
import { join } from 'path';
import * as dotenv from 'dotenv';

import * as crossDomain from '@midwayjs/cross-domain';
// import * as staticFile from '@midwayjs/static-file'
import * as swagger from '@midwayjs/swagger';
import * as task from '@midwayjs/task';
import * as redis from '@midwayjs/redis';
import * as bull from '@midwayjs/bull';
import * as typegoose from '@midwayjs/typegoose';
import * as lion from '@fta/server-middleware-lion';
import * as upload from '@midwayjs/upload';
import * as egg from '@midwayjs/web';
import { ModelMetricsService } from './service/common/model-metrics.service';
import { AuthMiddleware } from './middleware/auth';

// load .env file in process.cwd
dotenv.config();

@Configuration({
  // imports 的顺序很重要 egg必须在第一个～
  imports: [
    egg,
    task, // 定时任务
    lion, // 加载 lion 配置中心组件
    typegoose, // typegoose mongoose
    {
      component: swagger, //! 加载 swagger 组件（限制版本号！）
      enabledEnvironment: ['local'],
    },
    // staticFile, // 静态文件组件，下载缓存资源
    crossDomain, // 跨域
    redis, // Redis 客户端
    bull, // Bull 队列
    upload, // 文件上传组件
  ],
  importConfigs: [join(__dirname, './config')],
  conflictCheck: true,
})
export class ContainerLifeCycle implements ILifeCycle {
  @App()
  app: Application;

  async onReady(container: IMidwayContainer) {
    this.app.useMiddleware(AuthMiddleware);
    // 预热模型指标服务，确保单例在启动阶段即开始轮询
    await container.getAsync(ModelMetricsService);
  }

  async onServerReady(container: IMidwayContainer) {}
}
