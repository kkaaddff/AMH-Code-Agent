import { modelOptions, prop, Severity } from '@typegoose/typegoose'
import { EntityModel } from '@midwayjs/typegoose'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'completed' | 'editing'

@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_document_reference',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class DocumentReference {
  _id: any

  @prop({ required: true })
  id: string

  @prop({ required: true })
  url: string

  @prop({ required: true })
  name: string

  @prop({ enum: ['pending', 'syncing', 'synced', 'failed', 'completed', 'editing'], default: 'pending' })
  status: SyncStatus

  @prop({ default: 0, min: 0, max: 100 })
  progress: number

  @prop()
  lastSyncAt?: Date

  @prop({ type: Object })
  data?: Record<string, any>

  @prop({ type: Object })
  annotationData?: Record<string, any>

  @prop({ required: true })
  createdAt: Date

  @prop({ required: true })
  updatedAt: Date
}

@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_page',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Page {
  _id: any

  @prop({ required: true })
  id: string

  @prop({ required: true })
  projectId: string

  @prop({ required: true })
  name: string

  @prop({ required: true })
  routePath: string

  @prop()
  description: string

  // Skip ApiProperty for DocumentReference arrays to avoid circular references
  @prop({ ref: () => DocumentReference, default: () => [] })
  designDocuments: DocumentReference[]

  @prop({ ref: () => DocumentReference, default: () => [] })
  prdDocuments: DocumentReference[]

  @prop({ ref: () => DocumentReference, default: () => [] })
  openapiDocuments: DocumentReference[]

  @prop({ default: () => [] })
  designSpecs: string[]

  @prop({ default: () => [] })
  prds: string[]

  @prop({ default: () => [] })
  components: string[]

  @prop({ required: true })
  createdAt: Date

  @prop({ required: true })
  updatedAt: Date
}

@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_project',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Project {
  @prop({ required: true, unique: true })
  id: string

  @prop({ required: true })
  name: string

  @prop()
  description: string

  @prop()
  gitRepository: string

  @prop({ required: true })
  manager: string

  @prop({ enum: ['active', 'paused', 'completed', 'archived'], default: 'active' })
  status: string

  @prop({ default: 0, min: 0, max: 100 })
  progress: number

  @prop({ default: 1, min: 1 })
  members: number

  @prop({ default: () => [] })
  tags: string[]

  @prop({ default: '📁' })
  avatar: string

  @prop({ ref: () => Page, default: () => [] })
  pages: Page[]

  @prop({ required: true })
  createdAt: Date

  @prop({ required: true })
  updatedAt: Date
}
