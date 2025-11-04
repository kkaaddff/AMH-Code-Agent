import { ApiProperty } from "@midwayjs/swagger";

export * from "./types/design-dsl";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export class AsyncResponse {
  @ApiProperty({ example: true, description: "请求成功" })
  public success = true;
  @ApiProperty({ example: "Success", description: "接口信息" })
  public message = "Success";
}

export class PageHelper {
  @ApiProperty({ example: 10, required: true, description: "分页大小" })
  public pageSize: number;

  @ApiProperty({ example: 1, required: true, description: "页码" })
  public current: number;
}

export type TGitlabProject = {
  id: number;
  description: string;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  created_at: string;
  default_branch: string;
  tag_list: string[];
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  readme_url: string;
  avatar_url: string;
  star_count: number;
  forks_count: number;
  last_activity_at: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
    parent_id: number;
    avatar_url: string;
    web_url: string;
  };
};
