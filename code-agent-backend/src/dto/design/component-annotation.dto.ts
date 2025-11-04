import { ApiProperty } from "@midwayjs/swagger";
import { AsyncResponse } from "../../types";
import { DesignComponentAnnotationEntity } from "../../entity/design";

export class SaveDesignAnnotationBody {
  @ApiProperty({
    required: false,
    example: 2,
    description: "标注版本号，自增。缺省时由服务端生成",
  })
  version?: number;

  @ApiProperty({
    required: true,
    description: "标注根节点数据结构",
    type: "object",
  })
  rootAnnotation: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: "展开的节点 ID 列表",
    type: [String],
  })
  expandedKeys?: string[];

  @ApiProperty({
    required: false,
    example: "1.0.0",
    description: "标注协议版本",
  })
  schemaVersion?: string;

  @ApiProperty({
    required: false,
    example: true,
    description: "是否覆盖现有版本",
  })
  force?: boolean;
}

export class GetDesignAnnotationQuery {
  @ApiProperty({ required: false, example: 2, description: "指定标注版本号" })
  version?: number;
}

export class GetDesignAnnotationResponse extends AsyncResponse {
  @ApiProperty({
    type: DesignComponentAnnotationEntity,
    description: "标注实体",
  })
  data: DesignComponentAnnotationEntity;

  constructor(data: DesignComponentAnnotationEntity) {
    super();
    this.data = data;
  }
}

export class DiffDesignAnnotationQuery {
  @ApiProperty({ required: true, example: 1, description: "旧版本号" })
  fromVersion: number;

  @ApiProperty({ required: true, example: 2, description: "新版本号" })
  toVersion: number;
}

export class DiffChangeSetItem {
  @ApiProperty({ example: "node-001", description: "节点 ID" })
  nodeId: string;

  @ApiProperty({
    example: "added",
    enum: ["added", "removed", "updated"],
    description: "变更类型",
  })
  changeType: "added" | "removed" | "updated";

  @ApiProperty({ description: "差异详情", required: false })
  detail?: Record<string, unknown>;
}

export class DiffDesignAnnotationResponse extends AsyncResponse {
  @ApiProperty({ type: [DiffChangeSetItem], description: "差异集合" })
  data: DiffChangeSetItem[];

  constructor(data: DiffChangeSetItem[]) {
    super();
    this.data = data;
  }
}
