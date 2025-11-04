import { EggAppInfo } from "egg";
import { MidwayConfig } from "@midwayjs/core";
import path from "path";
import dayjs from "dayjs";

// host: 'r-bp12wj0lc2p4m4s1ge.redis.rds.aliyuncs.com',
// host: 'prod-redis-kong-gateway-sentinel-rds-hz.tairpena.rds.aliyuncs.com',
const defaultRedisHost = "r-bp1hadttipie5hddit.tairpena.rds.aliyuncs.com";
const defaultRedisPort = 6379;
const defaultRedisDb = 0;
const bullRedisDb = defaultRedisDb;
const bullPrefix = "fta:design";

export default (appInfo: EggAppInfo) => {
  const config = {} as MidwayConfig;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_20251029_638";

  config.cors = {
    credentials: true,
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "SonicToken",
      "FTAToken",
      "x-page-url",
      "Yu1",
    ],
    origin: ({ ctx }: any) => {
      return ctx.header.origin;
    },
    exposeHeaders: "*",
    keepHeadersOnError: true,
    maxAge: 600,
  };

  const phantomLogPath = "/data/ymmapplogs/fta-server/logs/";
  const logsPath =
    process.platform === "linux"
      ? phantomLogPath
      : path.join(process.cwd(), "logs");

  // 定义通用的日志格式化函数
  const commonLoggerFormat = (info: any) => {
    // 处理时间戳，优先使用传入的timestamp，否则使用当前时间
    let time = "";
    if (info.timestamp) {
      try {
        time = dayjs(info.timestamp.split(",")[0]).format();
      } catch {
        time = dayjs().format();
      }
    }
    const threadId = `Thread-${process.pid}`;
    return JSON.stringify({
      pro: "code-agent-backend",
      level: info.level ? info.level.toUpperCase() : "INFO",
      time: time,
      msg: info.message,
      thread: threadId,
      loc: info.stack || "<unknown>",
    });
  };
  config.midwayLogger = {
    // fix: 错误以及其他日志会被记录到 roots 中
    default: {
      dir: logsPath,
      level: "warn",
      format: commonLoggerFormat,
    },
    clients: {
      appLogger: {
        fileLogName: "app.log",
        level: "info",
        enableConsole: true,
        enableFile: false,
        format: commonLoggerFormat,
      },
      // 错误日志也使用统一格式
      errorLogger: {
        fileLogName: "error.log",
        level: "error",
        enableFile: true,
        format: commonLoggerFormat,
      },
      // 通用日志也使用统一格式
      coreLogger: {
        fileLogName: "midway-core.log",
        level: "warn",
        enableFile: true,
        format: commonLoggerFormat,
      },
    },
  };

  config.egg = {
    port: Number(process.env.YMM_GLOBAL_PORT || 7001),
    contextLoggerFormat: commonLoggerFormat,
  };

  config.mongoose = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    client: {
      uri: "mongodb://dds-bp1ffb1e95127c741.mongodb.rds.aliyuncs.com:3717,dds-bp1ffb1e95127c742.mongodb.rds.aliyuncs.com:3717/fta",
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
        user: "ftauser",
        pass: "BOd8dsox@l0",
        readPreference: "primaryPreferred",
      },
    },
  };

  config.swagger = {
    title: "code-agent-backend",
  };

  /**
   * 文件上传逻辑
   */
  config.upload = {
    // mode: UploadMode, 默认为file，即上传到服务器临时目录，可以配置为 stream
    mode: "stream",
    // fileSize: string, 最大上传文件大小，默认为 10mb
    fileSize: "10mb",
  };

  /**
   * 这里加入这段是因为 egg 默认的安全策略，在 post 请求的时候如果不传递 token 会返回 403
   * 由于大部分新手用户不太了解这个机制，所以在本地和单测环境做了默认处理
   * 请注意，线上环境依旧会有该错误，需要手动开启
   * 如果想了解更多细节，请访问 https://eggjs.org/zh-cn/core/security.html#安全威胁-csrf-的防范
   */
  config.security = {
    csrf: { enable: false },
  };

  /**
   * Redis 配置
   */
  config.redis = {
    client: {
      host: defaultRedisHost,
      port: defaultRedisPort,
      db: defaultRedisDb,
    },
  };

  /**
   * Bull 队列配置
   */
  config.bull = {
    // 默认队列选项
    defaultQueueOptions: {
      // 队列前缀，用于区分不同应用的队列
      prefix: bullPrefix,
      // 默认任务选项
      defaultJobOptions: {
        // 完成的任务保留数量，超过会自动清理
        removeOnComplete: 20,
        // 失败的任务保留数量，超过会自动清理
        removeOnFail: 50,
      },
      // Redis 连接配置
      redis: {
        // Redis 主机地址
        host: defaultRedisHost,
        // Redis 端口
        port: defaultRedisPort,
        // Redis 数据库编号
        db: bullRedisDb,
      },
    },
    // 默认并发处理任务数量
    defaultConcurrency: 2,
    // 启动时清理重复任务
    clearRepeatJobWhenStart: true,
  };

  /**
   * 设计模块配置
   */
  config.designModule = {
    cacheTTL: {
      dsl: 60 * 60,
      annotation: 60 * 30,
    },
    codeGeneration: {
      concurrency: 2,
      resultExpireSeconds: 7 * 24 * 60 * 60,
    },
  };

  /**
   * MasterGo 集成配置
   */
  config.mastergo = {
    baseUrl: "https://mg.amh-group.com",
    token: "mg_27eea23a42b54a3dbd338ea9ce80ea52",
  };

  /**
   * 模型网关配置
   */
  config.modelGateway = {
    default: {
      endpoint: process.env.MODEL_ENDPOINT,
      apiKey: process.env.MODEL_API_KEY,
      model: process.env.MODEL_NAME,
      timeout: process.env.MODEL_TIMEOUT
        ? Number(process.env.MODEL_TIMEOUT)
        : undefined,
      temperature: process.env.MODEL_TEMPERATURE
        ? Number(process.env.MODEL_TEMPERATURE)
        : undefined,
    },
  };

  /**
   * lion 配置
   */
  config.lion = {
    deployenv: "qa",
    zkserver: "dev-zk-00.ts:2181,dev-zk-01.ts:2181,dev-zk-02.ts:2181",
    "metadata.server.urls":
      "http://dev-meta.amh-group.com/metadata-server/config",
  };

  return config;
};
