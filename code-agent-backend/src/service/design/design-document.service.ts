import {
  Config,
  Inject,
  MidwayHttpError,
  Provide,
  Scope,
  ScopeEnum,
  HttpStatus,
} from "@midwayjs/core";
import { InjectEntityModel } from "@midwayjs/typegoose";
import type { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { RedisService } from "@midwayjs/redis";
import { createHash } from "crypto";
import { DesignDocumentEntity } from "../../entity/design";
import type {
  DesignDocumentPaginationQuery,
  CreateDesignDocumentBody,
  UpdateDesignDocumentBody,
} from "../../dto/design";
import { MasterGoService } from "./mastergo.service";

interface CachedDslPayload {
  revision: number;
  dsl: Record<string, unknown> | null;
}

const MAX_PAGE_SIZE = 100;

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class DesignDocumentService {
  @InjectEntityModel(DesignDocumentEntity)
  private designDocumentModel: ReturnModelType<typeof DesignDocumentEntity>;

  @Inject()
  private redisService: RedisService;

  @Inject()
  private mastergoService: MasterGoService;

  @Config("designModule")
  private designModuleConfig: {
    cacheTTL?: { dsl?: number };
    codeGeneration?: { concurrency?: number };
  };

  private getDslCacheKey(designId: string, revision?: number): string {
    const suffix = revision !== undefined ? `:${revision}` : "";
    return `design:dsl:${designId}${suffix}`;
  }

  private getDslCacheTTLSeconds(): number {
    const ttl = this.designModuleConfig?.cacheTTL?.dsl;
    if (Number.isFinite(ttl) && Number(ttl) > 0) {
      return Number(ttl);
    }
    return 60 * 60;
  }

  private computeDslDigest(dslData: Record<string, unknown>): string {
    const json = JSON.stringify(dslData);
    return createHash("sha256").update(json).digest("hex");
  }

  private async cacheDsl(
    designId: string,
    revision: number,
    dslData: Record<string, unknown> | null
  ): Promise<void> {
    const payload: CachedDslPayload = { revision, dsl: dslData };
    const serialized = JSON.stringify(payload);
    const ttl = this.getDslCacheTTLSeconds();
    try {
      await this.redisService.set(
        this.getDslCacheKey(designId),
        serialized,
        "EX",
        ttl
      );
      await this.redisService.set(
        this.getDslCacheKey(designId, revision),
        serialized,
        "EX",
        ttl
      );
    } catch (error) {
      console.warn(
        `Failed to cache design DSL for designId=${designId}`,
        error
      );
    }
  }

  private async parseCachedDsl(key: string): Promise<CachedDslPayload | null> {
    try {
      const cached = await this.redisService.get(key);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as CachedDslPayload;
    } catch (error) {
      console.warn(`Failed to parse cached DSL for key=${key}`, error);
      return null;
    }
  }

  private normalizeDocument(
    doc:
      | DocumentType<DesignDocumentEntity>
      | (DesignDocumentEntity & { _id?: any })
  ): DesignDocumentEntity {
    if (!doc) {
      return null;
    }
    const plain =
      typeof (doc as any).toObject === "function"
        ? (doc as any).toObject()
        : { ...(doc as any) };
    if (
      plain._id &&
      typeof plain._id === "object" &&
      typeof plain._id.toString === "function"
    ) {
      plain._id = plain._id.toString();
    }
    if (plain.createdAt instanceof Date) {
      plain.createdAt = plain.createdAt.toISOString();
    }
    if (plain.updatedAt instanceof Date) {
      plain.updatedAt = plain.updatedAt.toISOString();
    }
    return plain as DesignDocumentEntity;
  }

  public async createDesignDocument(
    payload: CreateDesignDocumentBody,
    operatorId: string
  ): Promise<DesignDocumentEntity> {
    const { mastergoUrl, tags, metadata, ...rest } = payload;

    // Fetch DSL from MasterGo
    const dslResponse = await this.mastergoService.getDslFromUrl(mastergoUrl);
    const dslData = dslResponse.dsl;

    const doc = await this.designDocumentModel.create({
      ...rest,
      mastergoUrl,
      dslData,
      dslRevision: 1,
      dslDigest: dslData ? this.computeDslDigest(dslData) : undefined,
      tags: tags ?? [],
      metadata: {
        ...(metadata ?? {}),
        componentDocumentLinks: dslResponse.componentDocumentLinks,
      },
      status: "active",
      createdBy: operatorId,
      updatedBy: operatorId,
    });
    const normalized = this.normalizeDocument(doc);
    await this.cacheDsl(
      normalized._id,
      normalized.dslRevision ?? 1,
      (normalized as any).dslData ?? null
    );
    return normalized;
  }

  public async updateDesignDocument(
    designId: string,
    payload: UpdateDesignDocumentBody,
    operatorId: string
  ): Promise<DesignDocumentEntity> {
    const document = await this.designDocumentModel.findById(designId);
    if (!document) {
      throw new MidwayHttpError(
        "Design document not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (
      typeof payload.dslRevision === "number" &&
      typeof document.dslRevision === "number" &&
      payload.dslRevision !== document.dslRevision
    ) {
      throw new MidwayHttpError(
        "DSL revision mismatch, please refresh and retry",
        HttpStatus.CONFLICT
      );
    }

    let nextRevision = document.dslRevision ?? 1;
    let nextDslData: Record<string, unknown> | null = null;

    if (payload.name !== undefined) {
      document.name = payload.name;
    }
    if (payload.description !== undefined) {
      document.description = payload.description;
    }
    if (payload.status !== undefined) {
      document.status = payload.status as any;
    }
    if (payload.tags !== undefined) {
      document.tags = payload.tags;
    }
    if (payload.metadata !== undefined) {
      document.metadata = payload.metadata;
    }

    if (payload.dslData !== undefined) {
      document.dslData = payload.dslData;
      nextRevision = (document.dslRevision ?? 0) + 1;
      document.dslRevision = nextRevision;
      document.dslDigest = payload.dslData
        ? this.computeDslDigest(payload.dslData)
        : undefined;
      nextDslData = payload.dslData;
      document.markModified("dslData");
    }

    document.updatedBy = operatorId;
    document.updatedAt = new Date();

    const saved = await document.save();
    const normalized = this.normalizeDocument(saved);
    if (nextDslData !== null) {
      await this.cacheDsl(designId, nextRevision, nextDslData);
    } else if (payload.dslData === null) {
      await this.cacheDsl(designId, nextRevision, null);
    }
    return normalized;
  }

  public async getDesignDocumentById(
    designId: string
  ): Promise<DesignDocumentEntity | null> {
    const doc = await this.designDocumentModel.findById(designId).lean();
    if (!doc) {
      return null;
    }
    if (doc._id && typeof (doc._id as any).toString === "function") {
      doc._id = (doc._id as any).toString();
    }
    if (doc.createdAt instanceof Date) {
      doc.createdAt = doc.createdAt.toISOString() as any;
    }
    if (doc.updatedAt instanceof Date) {
      doc.updatedAt = doc.updatedAt.toISOString() as any;
    }
    return doc as DesignDocumentEntity;
  }

  public async paginateDesignDocuments(
    query: DesignDocumentPaginationQuery
  ): Promise<{ list: DesignDocumentEntity[]; total: number }> {
    const pageSize = Math.min(Number(query.pageSize) || 10, MAX_PAGE_SIZE);
    const current = Math.max(Number(query.current) || 1, 1);
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status as any;
    }
    if (query.createdBy) {
      filter.createdBy = query.createdBy;
    }
    if (query.keyword) {
      const regex = new RegExp(query.keyword, "i");
      filter.$or = [{ name: regex }, { description: regex }];
    }

    const [list, total] = await Promise.all([
      this.designDocumentModel
        .find(filter, null, { lean: true })
        .sort({ updatedAt: -1 })
        .skip((current - 1) * pageSize)
        .limit(pageSize),
      this.designDocumentModel.countDocuments(filter),
    ]);

    const normalized = list.map((item: any) => {
      if (item._id && typeof item._id.toString === "function") {
        item._id = item._id.toString();
      }
      if (item.createdAt instanceof Date) {
        item.createdAt = item.createdAt.toISOString();
      }
      if (item.updatedAt instanceof Date) {
        item.updatedAt = item.updatedAt.toISOString();
      }
      return item as DesignDocumentEntity;
    });

    return { list: normalized, total };
  }

  public async getDesignDsl(
    designId: string,
    revision?: number
  ): Promise<{ dsl: Record<string, unknown> | null; revision: number | null }> {
    const cacheKey = this.getDslCacheKey(designId, revision);
    const cached = await this.parseCachedDsl(cacheKey);
    if (cached && (revision === undefined || cached.revision === revision)) {
      return { dsl: cached.dsl, revision: cached.revision };
    }

    const doc = await this.designDocumentModel
      .findById(designId, { dslData: 1, dslRevision: 1 })
      .lean<{ dslData?: Record<string, unknown>; dslRevision?: number }>();

    if (!doc) {
      return { dsl: null, revision: null };
    }

    const docRevision = doc.dslRevision ?? 0;
    const dslData = (doc.dslData ?? null) as Record<string, unknown> | null;

    await this.cacheDsl(designId, docRevision, dslData);

    if (revision !== undefined && revision !== docRevision) {
      return { dsl: null, revision: docRevision };
    }

    return { dsl: dslData, revision: docRevision };
  }
}
