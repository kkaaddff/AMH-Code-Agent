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

  private getModelEndpoint(baseURL?: string): string {
    const finalBaseURL = baseURL || this.modelGatewayConfig?.baseURL;
    if (!finalBaseURL) {
      throw new Error('Model gateway baseURL is not configured');
    }
    return `${finalBaseURL.replace(/\/$/, '')}/chat/completions`;
  }

  private getModelHeaders(apiKey?: string, accept?: string): Record<string, string> {
    const finalApiKey = apiKey || this.modelGatewayConfig?.apiKey;
    if (!finalApiKey) {
      throw new Error('Model gateway apiKey is not configured');
    }
    return {
      Authorization: `Bearer ${finalApiKey}`,
      'Content-Type': 'application/json',
      Accept: accept || 'text/event-stream',
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

  private buildOpenAIRequest(payload: Record<string, any>, stream: boolean, model?: string): Record<string, any> {
    const requestPayload: Record<string, any> = {
      ...payload,
      stream,
    };

    // 优先使用传入的 model，其次使用 payload 中的 model，最后使用配置中的 model
    if (model) {
      requestPayload.model = model;
    } else if (!requestPayload.model && this.modelGatewayConfig?.model) {
      requestPayload.model = this.modelGatewayConfig.model;
    }

    this.ensureOpenAIStyleMessages(requestPayload);

    return requestPayload;
  }

  /**
   * 从请求体中提取并验证模型配置参数
   * @param normalizedBody 规范化后的请求体
   * @returns 提取的配置和剩余请求体
   */
  private extractAndValidateConfig(normalizedBody: Record<string, any>): {
    apiKey: string;
    baseURL: string;
    model?: string;
    restBody: Record<string, any>;
  } {
    const { apiKey, baseURL, model, ...restBody } = normalizedBody;

    const finalApiKey = apiKey || this.modelGatewayConfig?.apiKey;
    const finalBaseURL = baseURL || this.modelGatewayConfig?.baseURL;
    const finalModel = model || this.modelGatewayConfig?.model;

    if (!finalApiKey || !finalBaseURL) {
      const missingParams: string[] = [];
      if (!finalApiKey) missingParams.push('apiKey');
      if (!finalBaseURL) missingParams.push('baseURL');
      throw new Error(`缺少必需的模型配置参数: ${missingParams.join(', ')}。请通过请求参数或配置文件提供。`);
    }

    return {
      apiKey: finalApiKey,
      baseURL: finalBaseURL,
      model: finalModel,
      restBody,
    };
  }

  /**
   * 发送 SSE 格式的错误响应
   */
  private sendSSEError(status: number, error: string): void {
    this.ctx.status = status;
    if (!this.ctx.res.headersSent) {
      this.ctx.res.writeHead(status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'close',
      });
    }
    this.ctx.res.write(`data: ${JSON.stringify({ error })}\n\n`);
    this.ctx.res.write('data: [DONE]\n\n');
    this.ctx.res.end();
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
      const normalizedBody = this.normalizeRequestBody(questionBody);
      const { apiKey, baseURL, model, restBody } = this.extractAndValidateConfig(normalizedBody);

      const payload = this.buildOpenAIRequest(restBody, true, model);
      const headers = this.getModelHeaders(apiKey);
      const endpoint = this.getModelEndpoint(baseURL);

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
      this.sendSSEError(500, message);
    }
  }

  @Post('/model-gateway-sync')
  async modelGatewaySync(@Body() questionBody: any) {
    const normalizedBody = this.normalizeRequestBody(questionBody);

    const { apiKey, baseURL, model, restBody } = this.extractAndValidateConfig(normalizedBody);
    const payload = this.buildOpenAIRequest(restBody, false, model);

    const start = Date.now();

    try {
      const headers = this.getModelHeaders(apiKey, 'application/json');
      const endpoint = this.getModelEndpoint(baseURL);

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

      const durationMs = Date.now() - start;
      const durationS = (durationMs / 1000).toFixed(2);
      // 控制台输出耗时（单位：秒）
      console.log(`[model-gateway-sync] 请求耗时: ${durationS}s`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      const durationMs = Date.now() - start;
      const durationS = (durationMs / 1000).toFixed(2);
      // 控制台输出耗时（单位：秒）
      console.log(`[model-gateway-sync] 请求耗时: ${durationS}s`);

      this.ctx.status = error.response?.status || 500;
      return {
        success: false,
        error: error.response?.data || error.message || 'Request Error',
      };
    }
  }
}
