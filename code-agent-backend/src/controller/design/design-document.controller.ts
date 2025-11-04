import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from "@midwayjs/decorator";
import { ApiOkResponse, ApiOperation, ApiTags } from "@midwayjs/swagger";
import { Context } from "@midwayjs/web";
import { HttpStatus, MidwayHttpError } from "@midwayjs/core";
import {
  CreateDesignDocumentBody,
  DesignDocumentDetailResponse,
  DesignDocumentDslResponse,
  DesignDocumentListResponse,
  DesignDocumentPaginationQuery,
  UpdateDesignDocumentBody,
} from "../../dto/design";
import { DesignDocumentService } from "../../service/design";

@ApiTags(["Design"])
@Controller("/design", { description: "Design Document Management" })
export class DesignDocumentController {
  @Inject()
  ctx: Context;

  @Inject()
  private designDocumentService: DesignDocumentService;

  private resolveOperatorId(): string {
    const ctxAny = this.ctx as any;
    const user = ctxAny?.user || ctxAny?.state?.user || {};
    const headers = this.ctx.headers || {};
    return (
      user.jobNum ||
      user.jobId ||
      user.id ||
      headers["x-operator-id"] ||
      headers["x-user-id"] ||
      this.ctx.get("x-operator-id") ||
      this.ctx.get("x-user-id") ||
      "system"
    );
  }

  @ApiOperation({ summary: "创建设计稿" })
  @ApiOkResponse({ type: DesignDocumentDetailResponse })
  @Post("/")
  async createDesign(@Body() body: CreateDesignDocumentBody) {
    const operatorId = this.resolveOperatorId();
    const result = await this.designDocumentService.createDesignDocument(
      body,
      operatorId
    );
    return new DesignDocumentDetailResponse(result);
  }

  @ApiOperation({ summary: "分页查询设计稿列表" })
  @ApiOkResponse({ type: DesignDocumentListResponse })
  @Get("/")
  async paginateDesigns(@Query() query: DesignDocumentPaginationQuery) {
    const { list, total } =
      await this.designDocumentService.paginateDesignDocuments(query);
    return new DesignDocumentListResponse(list, total);
  }

  @ApiOperation({ summary: "获取设计稿详情" })
  @ApiOkResponse({ type: DesignDocumentDetailResponse })
  @Get("/:designId")
  async getDesignDetail(@Param("designId") designId: string) {
    const doc = await this.designDocumentService.getDesignDocumentById(
      designId
    );
    if (!doc) {
      throw new MidwayHttpError(
        "Design document not found",
        HttpStatus.NOT_FOUND
      );
    }
    return new DesignDocumentDetailResponse(doc);
  }

  @ApiOperation({ summary: "更新设计稿信息或 DSL" })
  @ApiOkResponse({ type: DesignDocumentDetailResponse })
  @Put("/:designId")
  async updateDesign(
    @Param("designId") designId: string,
    @Body() body: UpdateDesignDocumentBody
  ) {
    const operatorId = this.resolveOperatorId();
    const result = await this.designDocumentService.updateDesignDocument(
      designId,
      body,
      operatorId
    );
    return new DesignDocumentDetailResponse(result);
  }

  @ApiOperation({ summary: "获取设计稿 DSL 数据" })
  @ApiOkResponse({ type: DesignDocumentDslResponse })
  @Get("/:designId/dsl")
  async getDesignDsl(
    @Param("designId") designId: string,
    @Query("revision") revision?: string
  ) {
    const parsedRevision =
      revision !== undefined ? Number(revision) : undefined;
    const revisionNum = Number.isFinite(parsedRevision)
      ? (parsedRevision as number)
      : undefined;
    const { dsl, revision: currentRevision } =
      await this.designDocumentService.getDesignDsl(designId, revisionNum);
    if (currentRevision === null) {
      throw new MidwayHttpError(
        "Design document not found",
        HttpStatus.NOT_FOUND
      );
    }
    return new DesignDocumentDslResponse(dsl, currentRevision);
  }
}
