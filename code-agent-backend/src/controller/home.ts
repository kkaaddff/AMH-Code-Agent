import { Config } from '@midwayjs/core';
import { Body, Controller, Get, Inject, Post, Query, Redirect } from '@midwayjs/decorator';
import type { Context } from '@midwayjs/web';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { ModelGatewayConfig } from '../service/common/model-gateway';

@Controller('/')
export class HomeController {
  @Inject()
  private ctx: Context;

  @Config('modelGateway.default')
  private modelGatewayConfig: ModelGatewayConfig;

  private getModelEndpoint(): string {
    const baseURL = this.modelGatewayConfig?.baseURL;
    if (!baseURL) {
      throw new Error('Model gateway baseURL is not configured');
    }
    return `${baseURL.replace(/\/$/, '')}/chat/completions`;
  }

  private getModelHeaders(): Record<string, string> {
    const apiKey = this.modelGatewayConfig?.apiKey;
    if (!apiKey) {
      throw new Error('Model gateway apiKey is not configured');
    }
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Connection: 'keep-alive',
    };
  }

  private normalizeRequestBody(questionBody: any): Record<string, any> {
    if (!questionBody) {
      return {};
    }

    if (typeof questionBody === 'string') {
      try {
        return JSON.parse(questionBody);
      } catch {
        throw new Error('Invalid JSON payload');
      }
    }

    return { ...questionBody };
  }

  private ensureOpenAIStyleMessages(payload: Record<string, any>): void {
    const messages = payload.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Model gateway expects an OpenAI-style payload with a non-empty messages array');
    }

    const hasSystemMessage = messages.some((message) => message?.role === 'system');
    if (!hasSystemMessage) {
      throw new Error('Model gateway requires the system prompt to be included as a system role message');
    }
  }

  private buildOpenAIRequest(payload: Record<string, any>, stream: boolean): Record<string, any> {
    const requestPayload: Record<string, any> = {
      ...payload,
      stream,
    };

    if (!requestPayload.model && this.modelGatewayConfig?.model) {
      requestPayload.model = this.modelGatewayConfig.model;
    }

    this.ensureOpenAIStyleMessages(requestPayload);

    return requestPayload;
  }

  @Get('/')
  @Redirect('/swagger-ui/index.html')
  async home() {}

  @Get('/redirect')
  async redirect(@Query('url') url?: string) {
    url = url ? decodeURIComponent(url) : 'https://fta.amh-group.com/';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://fta.amh-group.com/';
    }

    this.ctx.redirect(url);
  }

  @Post('/model-gateway')
  async modelGateway(@Body() questionBody: any) {
    try {
      const payload = this.buildOpenAIRequest(this.normalizeRequestBody(questionBody), true);
      const headers = this.getModelHeaders();
      const endpoint = this.getModelEndpoint();

      this.ctx.res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      await new Promise<void>((resolve, reject) => {
        axios({
          method: 'POST',
          url: endpoint,
          responseType: 'stream',
          data: payload,
          headers,
          timeout: this.modelGatewayConfig?.timeout ?? 600_000,
        })
          .then((response) => {
            if (response.status === 200) {
              response.data.on('data', (chunk) => {
                this.ctx.res.write(chunk.toString());
              });
              response.data.on('end', () => {
                this.ctx.res.end();
                resolve();
              });
            } else {
              reject(`Server responded with status code: ${response.status}`);
            }
          })
          .catch((error) => {
            this.ctx.res.end();
            reject(error);
          });
      });
    } catch (error: any) {
      const message = error?.message || 'Model gateway request failed';
      if (!this.ctx.res.headersSent) {
        this.ctx.res.writeHead(500, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'close',
        });
      }
      this.ctx.res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      this.ctx.res.write('data: [DONE]\n\n');
      this.ctx.res.end();
    }
  }

  @Post('/model-gateway-sync')
  async modelGatewaySync(@Body() questionBody: any) {
    let payload: Record<string, any>;
    try {
      payload = this.buildOpenAIRequest(this.normalizeRequestBody(questionBody), false);
    } catch (error: any) {
      this.ctx.status = 400;
      return {
        success: false,
        error: error?.message || 'Invalid request payload',
      };
    }

    const logDir = path.join(process.cwd(), 'logs', 'api');
    const timestamp = new Date().toISOString();
    const logFile = path.join(logDir, `model-gateway-sync-${new Date().toISOString().split('T')[0]}.log`);

    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 记录入参
    const requestLog = {
      timestamp,
      type: 'REQUEST',
      method: 'POST',
      endpoint: '/model-gateway-sync',
      payload,
    };

    const start = Date.now();

    try {
      const headers = this.getModelHeaders();
      const endpoint = this.getModelEndpoint();

      const response = await axios({
        method: 'POST',
        url: endpoint,
        data: payload,
        headers: {
          ...headers,
          Accept: 'application/json',
        },
        timeout: this.modelGatewayConfig?.timeout ?? 600_000,
      });

      const duration = Date.now() - start;
      // 控制台输出耗时
      console.log(`[model-gateway-sync] 请求耗时: ${duration}ms`);

      // 记录出参
      const responseLog = {
        timestamp: new Date().toISOString(),
        type: 'RESPONSE',
        method: 'POST',
        endpoint: '/model-gateway-sync',
        status: response.status,
        responseData: response.data,
        durationMs: duration,
      };

      // 写入日志文件
      const logEntry = JSON.stringify(requestLog) + '\n' + JSON.stringify(responseLog) + '\n' + '---\n';
      fs.appendFileSync(logFile, logEntry, 'utf8');

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      const duration = Date.now() - start;
      // 控制台输出耗时
      console.log(`[model-gateway-sync] 请求耗时: ${duration}ms`);

      // 记录错误日志
      const errorLog = {
        timestamp: new Date().toISOString(),
        type: 'ERROR',
        method: 'POST',
        endpoint: '/model-gateway-sync',
        status: error.response?.status || 500,
        error: error.response?.data || error.message || 'Request Error',
        durationMs: duration,
      };

      // 写入日志文件
      const logEntry = JSON.stringify(requestLog) + '\n' + JSON.stringify(errorLog) + '\n' + '---\n';
      fs.appendFileSync(logFile, logEntry, 'utf8');

      this.ctx.status = error.response?.status || 500;
      return {
        success: false,
        error: error.response?.data || error.message || 'Request Error',
      };
    }
  }
}
