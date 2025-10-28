// EditorPageComponentDetectV2 样式常量

// 布局相关
export const LAYOUT_HEIGHT = 'calc(100vh - 64px)';

// 颜色
export const COLORS = {
  border: 'rgb(240, 240, 240)',
  background: 'rgb(255, 255, 255)',
  secondary: '#d9d9d9',
  shadow: 'rgba(0,0,0,0.03)',
} as const;

// 间距
export const SPACING = {
  xs: '3px',
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '60px',
} as const;

// 边框半径
export const BORDER_RADIUS = {
  sm: '6px',
} as const;

// 字体
export const FONT = {
  weight: {
    normal: 400,
    medium: 500,
  },
  size: {
    sm: '14px',
  },
} as const;

// 过渡动画
export const TRANSITION = {
  background: 'background 0.2s, box-shadow 0.2s',
} as const;

// 组件样式
export const COMPONENT_STYLES = {
  // 加载容器
  loadingContainer: {
    width: '100%',
    height: LAYOUT_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 错误容器
  errorContainer: {
    width: '100%',
    height: LAYOUT_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 主布局
  mainLayout: {
    width: '100%',
    height: LAYOUT_HEIGHT,
  },

  // 侧边栏
  sider: {
    borderRight: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },

  rightSider: {
    borderLeft: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },

  // 内容区域
  content: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  // 头部工具栏
  headerToolbar: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderBottom: `1px solid ${COLORS.border}`,
    background: COLORS.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // 标题
  title: {
    margin: 0,
  },

  // 按钮样式
  button: {
    borderRadius: BORDER_RADIUS.sm,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    fontWeight: FONT.weight.medium,
  },

  // 画布容器
  canvasContainer: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    padding: `0 0 ${SPACING.xl}`,
  },

  // 检测画布容器
  detectionCanvasContainer: {
    width: '100%',
    height: '100%',
    padding: SPACING.xl,
  },

  // 折叠按钮
  collapseButton: {
    cursor: 'pointer',
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 100,
    height: SPACING.xxl,
    padding: `0 ${SPACING.xs}`,
    display: 'flex',
    alignItems: 'center',
    border: `1px dashed ${COLORS.secondary}`,
    borderRadius: BORDER_RADIUS.sm,
    background: COLORS.background,
    userSelect: 'none',
    fontWeight: FONT.weight.medium,
    fontSize: FONT.size.sm,
    transition: TRANSITION.background,
    boxShadow: `0 1px 2px ${COLORS.shadow}`,
  },

  // 左侧折叠按钮
  leftCollapseButton: {
    left: 0,
  },

  // 右侧折叠按钮
  rightCollapseButton: {
    right: 0,
  },
} as const;
