import { HttpStatus, Inject, MidwayHttpError, Provide, Scope, ScopeEnum } from '@midwayjs/core'
import { InjectEntityModel } from '@midwayjs/typegoose'
import type { DocumentType, ReturnModelType } from '@typegoose/typegoose'
import fse from 'fs-extra'
import path from 'path'
import { DesignRequirementDocumentEntity } from '../../entity/design'
import type {
  GenerateRequirementDocumentBody,
  RequirementDocumentPaginationQuery,
  UpdateRequirementDocumentBody,
} from '../../dto/design'
import { DesignDocumentService } from './design-document.service'
import { DesignComponentAnnotationService } from './component-annotation.service'
import { RequirementSpecModelService } from './requirement-spec-model.service'

const MAX_PAGE_SIZE = 50

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class DesignRequirementDocumentService {
  @InjectEntityModel(DesignRequirementDocumentEntity)
  private requirementDocModel: ReturnModelType<typeof DesignRequirementDocumentEntity>

  @Inject()
  private designDocumentService: DesignDocumentService

  @Inject()
  private designComponentAnnotationService: DesignComponentAnnotationService

  @Inject()
  private requirementSpecModelService: RequirementSpecModelService

  private normalizeDocument(
    doc: DocumentType<DesignRequirementDocumentEntity> | (DesignRequirementDocumentEntity & { _id?: any })
  ): DesignRequirementDocumentEntity {
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
    if (plain.publishedAt instanceof Date) {
      plain.publishedAt = plain.publishedAt.toISOString()
    }
    if (plain.archivedAt instanceof Date) {
      plain.archivedAt = plain.archivedAt.toISOString()
    }
    plain.exportFormats = Array.isArray(plain.exportFormats) ? plain.exportFormats : []
    return plain as DesignRequirementDocumentEntity
  }

  private ensureStatusTransition(current: string, next: string) {
    const transitions: Record<string, string[]> = {
      draft: ['published', 'archived'],
      published: ['archived'],
      archived: [],
    }
    const allowed = transitions[current] || []
    if (!allowed.includes(next)) {
      throw new MidwayHttpError(`Invalid status transition from ${current} to ${next}`, HttpStatus.BAD_REQUEST)
    }
  }

  public async generateRequirementDocument(
    designId: string,
    payload: GenerateRequirementDocumentBody,
    operatorId: string
  ): Promise<string> {
    const generation = await this.requirementSpecModelService.generateSpecification({
      templateKey: payload.templateKey,
      rootAnnotation: payload.rootAnnotation,
      annotationVersion: payload.annotationVersion,
      annotationSchemaVersion: payload.annotationSchemaVersion,
      operatorId,
    })

    return generation
  }

  public async updateRequirementDocument(
    docId: string,
    payload: UpdateRequirementDocumentBody,
    operatorId: string
  ): Promise<DesignRequirementDocumentEntity> {
    const doc = await this.requirementDocModel.findById(docId)
    if (!doc) {
      throw new MidwayHttpError('Requirement document not found', HttpStatus.NOT_FOUND)
    }

    if (payload.title !== undefined) {
      doc.title = payload.title
    }
    if (payload.content !== undefined) {
      doc.content = payload.content
      doc.markModified('content')
    }
    if (payload.status !== undefined && payload.status !== doc.status) {
      this.ensureStatusTransition(doc.status, payload.status)
      doc.status = payload.status
      if (payload.status === 'published') {
        doc.publishedAt = new Date()
      }
      if (payload.status === 'archived') {
        doc.archivedAt = new Date()
      }
    }

    doc.updatedBy = operatorId
    doc.updatedAt = new Date()

    const saved = await doc.save()
    return this.normalizeDocument(saved)
  }

  public async getRequirementDocumentById(docId: string): Promise<DesignRequirementDocumentEntity | null> {
    const doc = await this.requirementDocModel.findById(docId).lean()
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
    if (doc.publishedAt instanceof Date) {
      doc.publishedAt = doc.publishedAt.toISOString() as any
    }
    if (doc.archivedAt instanceof Date) {
      doc.archivedAt = doc.archivedAt.toISOString() as any
    }
    doc.exportFormats = Array.isArray(doc.exportFormats) ? doc.exportFormats : []
    return doc as DesignRequirementDocumentEntity
  }

  public async paginateRequirementDocuments(
    designId: string,
    query: RequirementDocumentPaginationQuery
  ): Promise<{ list: DesignRequirementDocumentEntity[]; total: number }> {
    const pageSize = Math.min(Number(query.pageSize) || 10, MAX_PAGE_SIZE)
    const current = Math.max(Number(query.current) || 1, 1)
    const filter: Record<string, unknown> = { designId }

    if (query.status) {
      filter.status = query.status
    }

    const [list, total] = await Promise.all([
      this.requirementDocModel
        .find(filter, null, { lean: true })
        .sort({ updatedAt: -1 })
        .skip((current - 1) * pageSize)
        .limit(pageSize),
      this.requirementDocModel.countDocuments(filter),
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
      if (item.publishedAt instanceof Date) {
        item.publishedAt = item.publishedAt.toISOString()
      }
      if (item.archivedAt instanceof Date) {
        item.archivedAt = item.archivedAt.toISOString()
      }
      item.exportFormats = Array.isArray(item.exportFormats) ? item.exportFormats : []
      return item as DesignRequirementDocumentEntity
    })

    return { list: normalized, total }
  }

  public async exportRequirementDocument(docId: string, operatorId: string): Promise<string> {
    const doc = await this.requirementDocModel.findById(docId)
    if (!doc) {
      throw new MidwayHttpError('Requirement document not found', HttpStatus.NOT_FOUND)
    }

    const relativeKey = path.posix.join('design', 'requirement-docs', `${doc._id}.md`)
    const outputDir = path.join(process.cwd(), 'files-cache', 'design', 'requirement-docs')
    await fse.ensureDir(outputDir)
    const absolutePath = path.join(outputDir, `${doc._id}.md`)
    await fse.writeFile(absolutePath, doc.content || '', { encoding: 'utf8' })

    doc.ossObjectKey = relativeKey
    doc.updatedBy = operatorId
    doc.updatedAt = new Date()
    const formats = new Set(doc.exportFormats ?? [])
    formats.add('md')
    doc.exportFormats = Array.from(formats)
    await doc.save()

    return `/filesCache/${relativeKey}`
  }
}
