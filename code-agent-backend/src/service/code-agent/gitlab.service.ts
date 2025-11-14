import { Provide } from '@midwayjs/decorator';
import axios from 'axios';

const GITLAB_API_TOKEN = 'p5j5J1xFcHsEKMxz4PGs';
const AMH_GITLAB_URL = 'https://code.amh-group.com';

@Provide()
export class GitlabService {
  /**
   * 从 GitLab URL 中提取项目路径
   * @param gitUrl GitLab 仓库 URL
   * @returns 项目路径 (例如: foo/bar)
   */
  private extractProjectPath(gitUrl: string): string {
    try {
      const url = new URL(gitUrl);
      // 移除开头的斜杠，获取路径部分
      let path = url.pathname.replace(/^\//, '');
      // 移除可能的 .git 后缀
      path = path.replace(/\.git$/, '');
      return path;
    } catch (error) {
      throw new Error(`Invalid GitLab URL: ${gitUrl}`);
    }
  }

  /**
   * 获取 GitLab 项目 ID
   * @param gitUrl GitLab 仓库 URL (例如: https://gitlab.com/foo/bar)
   * @param token GitLab Private Token (可选，公开项目无需提供)
   * @returns GitLab 项目 ID
   */
  async getGitlabProjectId(gitUrl: string): Promise<number> {
    try {
      // 提取项目路径
      const projectPath = this.extractProjectPath(gitUrl);

      // URL encode 项目路径
      const encodedPath = encodeURIComponent(projectPath);

      // 构建 API 请求 URL
      const apiUrl = `${AMH_GITLAB_URL}/api/v4/projects/${encodedPath}`;

      // 调用 GitLab API
      const response = await axios.get(apiUrl, { headers: { 'PRIVATE-TOKEN': GITLAB_API_TOKEN } });

      // 从响应中提取项目 ID
      if (response.data && typeof response.data.id === 'number') {
        return response.data.id;
      } else {
        throw new Error('Invalid response from GitLab API: missing project ID');
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 404) {
          throw new Error(`GitLab project not found: ${gitUrl}`);
        } else if (status === 401 || status === 403) {
          throw new Error(`Access denied to GitLab project. Please provide a valid token.`);
        } else {
          throw new Error(`GitLab API error: ${message}`);
        }
      }
      throw error;
    }
  }
}
