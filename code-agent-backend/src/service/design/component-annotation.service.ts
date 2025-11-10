import { Config, Inject, MidwayHttpError, Provide, Scope, ScopeEnum, HttpStatus } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import type { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { RedisService } from '@midwayjs/redis';
import { DesignComponentAnnotationEntity } from '../../entity/design';
import type { SaveDesignAnnotationBody, DiffDesignAnnotationQuery, DiffChangeSetItem } from '../../dto/design';

interface CachedAnnotationPayload {
  version: number;
  annotation: DesignComponentAnnotationEntity;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class DesignComponentAnnotationService {
  @InjectEntityModel(DesignComponentAnnotationEntity)
  private annotationModel: ReturnModelType<typeof DesignComponentAnnotationEntity>;

  @Inject()
  private redisService: RedisService;

  @Config('designModule')
  private designModuleConfig: { cacheTTL?: { annotation?: number } };

  private getAnnotationCacheKey(designId: string, version?: number): string {
    const suffix = version !== undefined ? `:${version}` : '';
    return `design:annotations:${designId}${suffix}`;
  }

  private getAnnotationCacheTTLSeconds(): number {
    const ttl = this.designModuleConfig?.cacheTTL?.annotation;
    if (Number.isFinite(ttl) && Number(ttl) > 0) {
      return Number(ttl);
    }
    return 30 * 60;
  }

  private normalizeAnnotation(
    doc: DocumentType<DesignComponentAnnotationEntity> | (DesignComponentAnnotationEntity & { _id?: any })
  ): DesignComponentAnnotationEntity {
    if (!doc) {
      return null;
    }
    const plain = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : { ...(doc as any) };
    if (plain._id && typeof plain._id === 'object' && typeof plain._id.toString === 'function') {
      plain._id = plain._id.toString();
    }
    if (plain.createdAt instanceof Date) {
      plain.createdAt = plain.createdAt.toISOString();
    }
    if (plain.updatedAt instanceof Date) {
      plain.updatedAt = plain.updatedAt.toISOString();
    }
    plain.expandedKeys = Array.isArray(plain.expandedKeys) ? plain.expandedKeys : [];
    return plain as DesignComponentAnnotationEntity;
  }

  private async cacheAnnotation(
    designId: string,
    version: number,
    annotation: DesignComponentAnnotationEntity,
    isLatest: boolean
  ): Promise<void> {
    const payload: CachedAnnotationPayload = { version, annotation };
    const serialized = JSON.stringify(payload);
    const ttl = this.getAnnotationCacheTTLSeconds();
    try {
      if (isLatest) {
        await this.redisService.set(this.getAnnotationCacheKey(designId), serialized, 'EX', ttl);
      }
      await this.redisService.set(this.getAnnotationCacheKey(designId, version), serialized, 'EX', ttl);
    } catch (error) {
      console.warn(`Failed to cache annotation for designId=${designId}`, error);
    }
  }

  private async parseCachedAnnotation(key: string): Promise<CachedAnnotationPayload | null> {
    try {
      const cached = await this.redisService.get(key);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as CachedAnnotationPayload;
    } catch (error) {
      console.warn(`Failed to parse cached annotation for key=${key}`, error);
      return null;
    }
  }

  private flattenAnnotation(root: any): Map<string, any> {
    const map = new Map<string, any>();
    const dfs = (node: any) => {
      if (!node || typeof node !== 'object') {
        return;
      }
      if (node.id) {
        map.set(node.id, node);
      }
      const children = node.children;
      if (Array.isArray(children)) {
        children.forEach((child) => dfs(child));
      }
    };
    dfs(root);
    return map;
  }

  public async saveAnnotation(
    designId: string,
    payload: SaveDesignAnnotationBody,
    operatorId: string
  ): Promise<DesignComponentAnnotationEntity> {
    const latestAnnotation = await this.annotationModel.findOne({ designId }).sort({ version: -1 }).lean();
    const existing = payload.version
      ? await this.annotationModel.findOne({
          designId,
          version: payload.version,
        })
      : null;

    let targetVersion = payload.version;

    if (existing) {
      if (!payload.force) {
        throw new MidwayHttpError('Annotation version already exists', HttpStatus.CONFLICT);
      }
      targetVersion = existing.version;
    } else if (targetVersion !== undefined) {
      if (latestAnnotation && targetVersion <= (latestAnnotation.version ?? 0) && !payload.force) {
        throw new MidwayHttpError(
          'Annotation version must be greater than current latest version',
          HttpStatus.CONFLICT
        );
      }
    } else {
      targetVersion = ((latestAnnotation?.version as number) ?? 0) + 1;
    }

    if (targetVersion === undefined || targetVersion <= 0) {
      throw new MidwayHttpError('Invalid annotation version', HttpStatus.BAD_REQUEST);
    }

    let record: DocumentType<DesignComponentAnnotationEntity>;
    const expandedKeys = payload.expandedKeys ?? [];
    const isLatestVersion = !latestAnnotation || targetVersion >= (latestAnnotation.version ?? 0);

    if (existing) {
      existing.rootAnnotation = payload.rootAnnotation as any;
      existing.expandedKeys = expandedKeys;
      existing.schemaVersion = payload.schemaVersion;
      existing.status = 'active';
      existing.updatedBy = operatorId;
      existing.updatedAt = new Date();
      existing.markModified('rootAnnotation');
      record = await existing.save();
    } else {
      record = await this.annotationModel.create({
        designId,
        version: targetVersion,
        rootAnnotation: payload.rootAnnotation as any,
        expandedKeys,
        schemaVersion: payload.schemaVersion,
        status: 'active',
        createdBy: operatorId,
        updatedBy: operatorId,
      });

      // 历史版本标记为归档
      await this.annotationModel.updateMany({ designId, _id: { $ne: record._id } }, { $set: { status: 'archived' } });
    }

    const normalized = this.normalizeAnnotation(record);
    await this.cacheAnnotation(
      designId,
      normalized.version,
      normalized,
      isLatestVersion || normalized.status === 'active'
    );
    return normalized;
  }

  public async getLatestAnnotation(
    designId: string,
    version?: number
  ): Promise<DesignComponentAnnotationEntity | null> {
    const cacheKey = this.getAnnotationCacheKey(designId, version);
    const cached = await this.parseCachedAnnotation(cacheKey);
    if (cached && (version === undefined || cached.version === version)) {
      return cached.annotation;
    }

    let doc: (DesignComponentAnnotationEntity & { _id?: any }) | null;
    if (version !== undefined) {
      doc = await this.annotationModel.findOne({ designId, version }).lean();
    } else {
      doc = await this.annotationModel.findOne({ designId, status: 'active' }).sort({ version: -1 }).lean();
      if (!doc) {
        doc = await this.annotationModel.findOne({ designId }).sort({ version: -1 }).lean();
      }
    }

    if (!doc) {
      return null;
    }

    const normalized = this.normalizeAnnotation(doc);
    const latestVersion = doc.status === 'active' || version === undefined;
    await this.cacheAnnotation(designId, normalized.version, normalized, latestVersion);
    return normalized;
  }

  public async diffAnnotations(designId: string, params: DiffDesignAnnotationQuery): Promise<DiffChangeSetItem[]> {
    const [from, to] = await Promise.all([
      this.getLatestAnnotation(designId, params.fromVersion),
      this.getLatestAnnotation(designId, params.toVersion),
    ]);

    if (!from || !to) {
      throw new MidwayHttpError('Annotation version not found', HttpStatus.NOT_FOUND);
    }

    const fromMap = this.flattenAnnotation(from.rootAnnotation);
    const toMap = this.flattenAnnotation(to.rootAnnotation);
    const changes: DiffChangeSetItem[] = [];

    for (const [nodeId, newNode] of toMap.entries()) {
      if (!fromMap.has(nodeId)) {
        changes.push({
          nodeId,
          changeType: 'added',
          detail: { after: newNode },
        });
      } else {
        const oldNode = fromMap.get(nodeId);
        if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
          changes.push({
            nodeId,
            changeType: 'updated',
            detail: { before: oldNode, after: newNode },
          });
        }
      }
    }

    for (const [nodeId, oldNode] of fromMap.entries()) {
      if (!toMap.has(nodeId)) {
        changes.push({
          nodeId,
          changeType: 'removed',
          detail: { before: oldNode },
        });
      }
    }

    return changes;
  }
}
