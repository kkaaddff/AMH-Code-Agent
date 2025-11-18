/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_REQUEST_TIMEOUT: string;
  readonly VITE_ENABLE_MOCK: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 用户信息类型定义
interface UserInfo {
  avatarUrl: string;
  departmentId: number;
  departmentName: string;
  departmentRole: number;
  gender: number;
  id: number;
  jobNumber: string;
  name: string;
  telephone: string;
  userType: number;
  cookies: {
    ymmoa_online?: string;
    ymmoa_passport?: string;
    qa_passport?: string;
    dev_passport?: string;
  };
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

// 工作空间信息类型定义
interface WorkspaceInfo {
  gitUrl?: string;
  workdir?: string;
  srcTree?: TreeNode; // src 目录树结构（三层）
}

// 扩展 Window 接口
interface Window {
  userInfo?: UserInfo;
  workspaceInfo?: WorkspaceInfo;
}
