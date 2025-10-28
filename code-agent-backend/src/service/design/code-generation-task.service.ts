import { HttpStatus, Inject, MidwayHttpError, Provide, Scope, ScopeEnum } from '@midwayjs/core'
import { InjectEntityModel } from '@midwayjs/typegoose'
import type { DocumentType, ReturnModelType } from '@typegoose/typegoose'
import { InjectQueue } from '@midwayjs/bull'
import type { Queue } from 'bull'
import dayjs from 'dayjs'
import { DesignCodeGenerationTaskEntity, DesignTaskLogEntity, CodeGenerationTaskResult } from '../../entity/design'
import type { CodeGenerationTaskPaginationQuery, CreateCodeGenerationTaskBody } from '../../dto/design'
import { DesignDocumentService } from './design-document.service'
import { DesignRequirementDocumentService } from './requirement-document.service'
import { DesignComponentAnnotationService } from './component-annotation.service'

export interface CodeGenerationQueuePayload {
  taskId: string
}

interface TaskContext {
  task: DesignCodeGenerationTaskEntity
  design: any
  requirementDoc: any
  annotation: any
}

const MAX_PAGE_SIZE = 50
const LOG_LIMIT = 20

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class DesignCodeGenerationTaskService {
  @InjectEntityModel(DesignCodeGenerationTaskEntity)
  private taskModel: ReturnModelType<typeof DesignCodeGenerationTaskEntity>

  @InjectEntityModel(DesignTaskLogEntity)
  private taskLogModel: ReturnModelType<typeof DesignTaskLogEntity>

  @Inject()
  private designDocumentService: DesignDocumentService

  @Inject()
  private requirementDocumentService: DesignRequirementDocumentService

  @Inject()
  private designComponentAnnotationService: DesignComponentAnnotationService

  @InjectQueue('design:code-generation')
  private designCodeGenerationQueue: Queue<CodeGenerationQueuePayload>

  private normalizeTask(
    doc: DocumentType<DesignCodeGenerationTaskEntity> | (DesignCodeGenerationTaskEntity & { _id?: any })
  ): DesignCodeGenerationTaskEntity {
    if (!doc) {
      return null
    }
    const plain = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : { ...(doc as any) }
    if (plain._id && typeof plain._id === 'object' && typeof plain._id.toString === 'function') {
      plain._id = plain._id.toString()
    }
    if (plain.createdAt instanceof Date) {
      plain.createdAt = plain.createdAt.toISOString()
    }
    if (plain.updatedAt instanceof Date) {
      plain.updatedAt = plain.updatedAt.toISOString()
    }
    if (plain.completedAt instanceof Date) {
      plain.completedAt = plain.completedAt.toISOString()
    }
    plain.logs = Array.isArray(plain.logs) ? plain.logs : []
    plain.options = plain.options ?? {}
    return plain as DesignCodeGenerationTaskEntity
  }

  private async enqueueTask(taskId: string): Promise<void> {
    await this.designCodeGenerationQueue.add(
      'generate',
      { taskId },
      {
        jobId: taskId,
        removeOnComplete: true,
        removeOnFail: false,
      }
    )
  }

  public async createTask(
    designId: string,
    payload: CreateCodeGenerationTaskBody,
    operatorId: string
  ): Promise<DesignCodeGenerationTaskEntity> {
    const design = await this.designDocumentService.getDesignDocumentById(designId)
    if (!design) {
      throw new MidwayHttpError('Design document not found', HttpStatus.NOT_FOUND)
    }

    if (!payload.taskType) {
      throw new MidwayHttpError('taskType is required', HttpStatus.BAD_REQUEST)
    }

    if (payload.requirementDocId) {
      const requirementDoc = await this.requirementDocumentService.getRequirementDocumentById(payload.requirementDocId)
      if (!requirementDoc || requirementDoc.designId !== designId) {
        throw new MidwayHttpError('Requirement document not found or mismatched', HttpStatus.BAD_REQUEST)
      }
    }

    const task = await this.taskModel.create({
      designId,
      requirementDocId: payload.requirementDocId,
      taskType: payload.taskType,
      options: payload.options ?? {},
      status: 'pending',
      progress: 0,
      logs: [],
      createdBy: operatorId,
    })

    const taskId = task._id.toString()
    await this.appendLog(taskId, '任务创建完成，等待调度')
    await this.enqueueTask(taskId)
    return this.normalizeTask(task)
  }

  public async getTaskById(taskId: string): Promise<DesignCodeGenerationTaskEntity | null> {
    const doc = await this.taskModel.findById(taskId).lean()
    if (!doc) {
      return null
    }
    if (doc._id && typeof (doc._id as any).toString === 'function') {
      doc._id = (doc._id as any).toString()
    }
    if (doc.createdAt instanceof Date) {
      doc.createdAt = doc.createdAt.toISOString() as any
    }
    if (doc.updatedAt instanceof Date) {
      doc.updatedAt = doc.updatedAt.toISOString() as any
    }
    if (doc.completedAt instanceof Date) {
      doc.completedAt = doc.completedAt.toISOString() as any
    }
    doc.logs = Array.isArray(doc.logs) ? doc.logs : []
    doc.options = doc.options ?? {}
    return doc as DesignCodeGenerationTaskEntity
  }

  public async paginateTasks(
    designId: string,
    query: CodeGenerationTaskPaginationQuery
  ): Promise<{ list: DesignCodeGenerationTaskEntity[]; total: number }> {
    const pageSize = Math.min(Number(query.pageSize) || 10, MAX_PAGE_SIZE)
    const current = Math.max(Number(query.current) || 1, 1)
    const filter: Record<string, unknown> = { designId }

    if (query.status) {
      filter.status = query.status
    }

    const [list, total] = await Promise.all([
      this.taskModel
        .find(filter, null, { lean: true })
        .sort({ updatedAt: -1 })
        .skip((current - 1) * pageSize)
        .limit(pageSize),
      this.taskModel.countDocuments(filter),
    ])

    const normalized = list.map((item: any) => {
      if (item._id && typeof item._id.toString === 'function') {
        item._id = item._id.toString()
      }
      if (item.createdAt instanceof Date) {
        item.createdAt = item.createdAt.toISOString()
      }
      if (item.updatedAt instanceof Date) {
        item.updatedAt = item.updatedAt.toISOString()
      }
      if (item.completedAt instanceof Date) {
        item.completedAt = item.completedAt.toISOString()
      }
      item.logs = Array.isArray(item.logs) ? item.logs : []
      item.options = item.options ?? {}
      return item as DesignCodeGenerationTaskEntity
    })

    return { list: normalized, total }
  }

  public async retryTask(taskId: string, operatorId: string): Promise<void> {
    const task = await this.taskModel.findById(taskId)
    if (!task) {
      throw new MidwayHttpError('Task not found', HttpStatus.NOT_FOUND)
    }
    if (task.status !== 'failed' && task.status !== 'canceled') {
      throw new MidwayHttpError('Only failed or canceled tasks can be retried', HttpStatus.BAD_REQUEST)
    }

    task.status = 'pending'
    task.progress = 0
    task.result = undefined
    task.error = undefined
    task.completedAt = undefined
    task.updatedAt = new Date()
    task.updatedBy = operatorId
    task.logs = []
    await task.save()

    await this.taskLogModel.deleteMany({ taskId })
    await this.appendLog(taskId, '任务已重置并重新入队')
    await this.enqueueTask(taskId)
  }

  public async appendLog(taskId: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const formatted = `[${level.toUpperCase()}][${timestamp}] ${message}`
    await this.taskModel.updateOne(
      { _id: taskId },
      {
        $push: {
          logs: {
            $each: [formatted],
            $slice: -LOG_LIMIT,
          },
        },
      }
    )
    await this.taskLogModel.create({
      taskId,
      message,
      level,
      context: {},
    })
  }

  public async getTaskLogs(taskId: string, limit = 50): Promise<DesignTaskLogEntity[]> {
    return this.taskLogModel.find({ taskId }).sort({ createdAt: -1 }).limit(limit).lean()
  }

  public async markProcessing(taskId: string, message?: string): Promise<void> {
    await this.taskModel.updateOne(
      { _id: taskId },
      {
        $set: {
          status: 'processing',
          progress: 5,
          updatedAt: new Date(),
        },
      }
    )
    if (message) {
      await this.appendLog(taskId, message)
    }
  }

  public async updateProgress(taskId: string, progress: number, message?: string): Promise<void> {
    await this.taskModel.updateOne(
      { _id: taskId },
      {
        $set: {
          progress: Math.min(Math.max(progress, 0), 100),
          updatedAt: new Date(),
        },
      }
    )
    if (message) {
      await this.appendLog(taskId, message)
    }
  }

  public async completeTask(taskId: string, result: CodeGenerationTaskResult): Promise<void> {
    await this.taskModel.updateOne(
      { _id: taskId },
      {
        $set: {
          status: 'completed',
          progress: 100,
          result,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )
    await this.appendLog(taskId, '任务已完成')
  }

  public async failTask(taskId: string, error: Error | string): Promise<void> {
    const message = typeof error === 'string' ? error : error.message
    const stack = typeof error === 'string' ? undefined : error.stack
    await this.taskModel.updateOne(
      { _id: taskId },
      {
        $set: {
          status: 'failed',
          error: {
            message,
            stack,
            retryCount: 0,
          },
          updatedAt: new Date(),
        },
      }
    )
    await this.appendLog(taskId, message, 'error')
  }

  public async loadTaskContext(taskId: string): Promise<TaskContext> {
    const task = await this.getTaskById(taskId)
    if (!task) {
      throw new MidwayHttpError('Task not found', HttpStatus.NOT_FOUND)
    }
    const design = await this.designDocumentService.getDesignDocumentById(task.designId)
    if (!design) {
      throw new MidwayHttpError('Design document not found', HttpStatus.NOT_FOUND)
    }
    const requirementDoc = task.requirementDocId
      ? await this.requirementDocumentService.getRequirementDocumentById(task.requirementDocId)
      : null
    const annotation = await this.designComponentAnnotationService.getLatestAnnotation(task.designId)

    return {
      task,
      design,
      requirementDoc,
      annotation,
    }
  }
}
