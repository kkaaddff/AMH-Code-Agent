import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from "@midwayjs/decorator";
import { ApiOkResponse, ApiOperation, ApiTags } from "@midwayjs/swagger";
import { Context } from "@midwayjs/web";
import { HttpStatus, MidwayHttpError } from "@midwayjs/core";
import {
  CodeGenerationTaskDetailResponse,
  CodeGenerationTaskDownloadResponse,
  CodeGenerationTaskListResponse,
  CodeGenerationTaskPaginationQuery,
  CreateCodeGenerationTaskBody,
} from "../../dto/design";
import { DesignCodeGenerationTaskService } from "../../service/design";

@ApiTags(["Design"])
@Controller("/design", { description: "Code Generation Task Management" })
export class CodeGenerationTaskController {
  @Inject()
  ctx: Context;

  @Inject()
  private designCodeGenerationTaskService: DesignCodeGenerationTaskService;

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

  @ApiOperation({ summary: "提交代码生成任务" })
  @ApiOkResponse({ type: CodeGenerationTaskDetailResponse })
  @Post("/:designId/code-generation")
  async createTask(
    @Param("designId") designId: string,
    @Body() body: CreateCodeGenerationTaskBody
  ) {
    const operatorId = this.resolveOperatorId();
    const task = await this.designCodeGenerationTaskService.createTask(
      designId,
      body,
      operatorId
    );
    return new CodeGenerationTaskDetailResponse(task);
  }

  @ApiOperation({ summary: "分页查询代码生成任务" })
  @ApiOkResponse({ type: CodeGenerationTaskListResponse })
  @Get("/:designId/code-generation-tasks")
  async listTasks(
    @Param("designId") designId: string,
    @Query() query: CodeGenerationTaskPaginationQuery
  ) {
    const { list, total } =
      await this.designCodeGenerationTaskService.paginateTasks(designId, query);
    return new CodeGenerationTaskListResponse(list, total);
  }

  @ApiOperation({ summary: "获取代码生成任务详情" })
  @ApiOkResponse({ type: CodeGenerationTaskDetailResponse })
  @Get("/code-generation-tasks/:taskId")
  async getTask(@Param("taskId") taskId: string) {
    const task = await this.designCodeGenerationTaskService.getTaskById(taskId);
    if (!task) {
      throw new MidwayHttpError("Task not found", HttpStatus.NOT_FOUND);
    }
    return new CodeGenerationTaskDetailResponse(task);
  }

  @ApiOperation({ summary: "重试代码生成任务" })
  @Post("/code-generation-tasks/:taskId/retry")
  async retryTask(@Param("taskId") taskId: string) {
    const operatorId = this.resolveOperatorId();
    await this.designCodeGenerationTaskService.retryTask(taskId, operatorId);
    const task = await this.designCodeGenerationTaskService.getTaskById(taskId);
    return new CodeGenerationTaskDetailResponse(task);
  }

  @ApiOperation({ summary: "获取代码生成任务产物下载地址" })
  @ApiOkResponse({ type: CodeGenerationTaskDownloadResponse })
  @Get("/code-generation-tasks/:taskId/download")
  async downloadTaskResult(@Param("taskId") taskId: string) {
    const task = await this.designCodeGenerationTaskService.getTaskById(taskId);
    if (!task) {
      throw new MidwayHttpError("Task not found", HttpStatus.NOT_FOUND);
    }
    if (task.status !== "completed" || !task.result?.outputZipKey) {
      throw new MidwayHttpError(
        "Task result not available yet",
        HttpStatus.BAD_REQUEST
      );
    }
    const downloadUrl = `/filesCache/${task.result.outputZipKey}`;
    return new CodeGenerationTaskDownloadResponse(downloadUrl);
  }
}
