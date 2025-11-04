import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
} from "@midwayjs/decorator";
import { Context } from "@midwayjs/web";
import * as path from "path";
import {
  ConvertPathRequest,
  ConvertPathResponse,
  GetDesignDSLResponse,
  ProcessDesignDSLRequest,
  ProcessDesignDSLResponse,
  RedisGetResponse,
  RedisSetRequest,
  RedisSetResponse,
} from "../../dto/design-dsl";
import { DesignDSLService } from "../../service/code-agent/design-dsl";

@Controller("/code-agent")
export class CodeAgentController {
  @Inject()
  private ctx: Context;

  @Inject()
  private designDSLService: DesignDSLService;

  /**
   * 获取DesignDSL原始数据
   */
  @Get("/dsl")
  async getDesignDSL(): Promise<GetDesignDSLResponse> {
    const dslPath = path.join(process.cwd(), "DesignDSL.json");
    const dslData = await this.designDSLService.readDesignDSLFile(dslPath);
    return new GetDesignDSLResponse(dslData);
  }

  /**
   * 处理DesignDSL数据
   */
  @Post("/dsl/process")
  async processDesignDSL(
    @Body() body: ProcessDesignDSLRequest
  ): Promise<ProcessDesignDSLResponse> {
    const dslPath = path.join(process.cwd(), "DesignDSL.json");
    const originalDSL = await this.designDSLService.readDesignDSLFile(dslPath);

    const processedDSL =
      body.convertPaths === false
        ? originalDSL
        : await this.designDSLService.processDesignDSL(originalDSL);
    const stats = await this.designDSLService.getDSLStats(processedDSL);

    return new ProcessDesignDSLResponse(processedDSL, stats);
  }

  /**
   * 获取Redis缓存
   */
  @Get("/dsl/cache")
  async getDslCache(@Query("key") key?: string): Promise<RedisGetResponse> {
    if (!key) {
      this.ctx.status = 400;
      return new RedisGetResponse(null);
    }
    const value = await this.designDSLService.redisGet(key);
    return new RedisGetResponse(value);
  }

  /**
   * 设置Redis缓存
   */
  @Post("/dsl/cache")
  async setDslCache(@Body() body: RedisSetRequest): Promise<RedisSetResponse> {
    if (!body?.key || typeof body.value !== "string") {
      this.ctx.status = 400;
      return new RedisSetResponse(false);
    }
    await this.designDSLService.redisSet(body.key, body.value, body.ttlSeconds);
    return new RedisSetResponse(true);
  }

  /**
   * 转换单个SVG路径
   */
  @Post("/dsl/convert-path")
  async convertPath(
    @Body() body: ConvertPathRequest
  ): Promise<ConvertPathResponse> {
    const result = await this.designDSLService.convertSinglePath(
      body.pathData,
      body.fillStyle,
      body.iconName
    );

    return new ConvertPathResponse(
      result.imageUrl,
      result.styleId,
      result.svgPath
    );
  }
}
