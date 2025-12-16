import { BackgroundTaskManager } from './backgroundTaskManager';
import { type Config, ConfigManager } from './config';
import { MCPManager } from './mcp';
import { Paths } from './paths';

type ContextOpts = {
  cwd: string;
  productName: string;
  productASCIIArt?: string;
  version: string;
  config: Config;
  paths: Paths;
  argvConfig: Record<string, any>;
  mcpManager: MCPManager;
  backgroundTaskManager: BackgroundTaskManager;
  toolProxy?: (toolName: string, params: any) => Promise<any>;
};

export type ContextCreateOpts = {
  cwd: string;
  productName: string;
  productASCIIArt?: string;
  version: string;
  argvConfig: Record<string, any>;
  toolProxy?: (toolName: string, params: any) => Promise<any>;
};

export class Context {
  cwd: string;
  productName: string;
  productASCIIArt?: string;
  version: string;
  config: Config;
  paths: Paths;
  argvConfig: Record<string, any>;
  mcpManager: MCPManager;
  backgroundTaskManager: BackgroundTaskManager;
  toolProxy?: (toolName: string, params: any) => Promise<any>;

  constructor(opts: ContextOpts) {
    this.cwd = opts.cwd;
    this.productName = opts.productName;
    this.productASCIIArt = opts.productASCIIArt;
    this.version = opts.version;
    this.config = opts.config;
    this.paths = opts.paths;
    this.argvConfig = opts.argvConfig;
    this.mcpManager = opts.mcpManager;
    this.backgroundTaskManager = opts.backgroundTaskManager;
    this.toolProxy = opts.toolProxy;
  }

  async destroy() {
    await this.mcpManager.destroy();
  }

  static async create(opts: ContextCreateOpts) {
    const { cwd, version, productASCIIArt } = opts;
    const productName = opts.productName.toLowerCase();
    const paths = new Paths({
      productName,
      cwd,
    });
    const configManager = new ConfigManager(cwd, productName, opts.argvConfig || {});
    const resolvedConfig = configManager.config;
    const mcpServers = {
      ...(resolvedConfig.mcpServers || {}),
      ...opts.argvConfig.mcpServers,
    };
    const mcpManager = MCPManager.create(mcpServers);
    const backgroundTaskManager = new BackgroundTaskManager();
    return new Context({
      cwd,
      productName,
      productASCIIArt,
      version,
      config: resolvedConfig,
      paths,
      argvConfig: opts.argvConfig,
      mcpManager,
      backgroundTaskManager,
      toolProxy: opts.toolProxy,
    });
  }
}
