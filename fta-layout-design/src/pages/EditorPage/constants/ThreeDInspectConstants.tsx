import * as THREE from 'three';

/** 3D 检视模态框常量定义 */

/** 3D 检视模态框尺寸常量 */
export const MODAL_CONFIG = {
  /** 模态框高度 - 提供足够的垂直空间显示3D场景 */
  HEIGHT: 800,
  /** 模态框宽度 - 宽屏显示以容纳复杂的3D场景 */
  WIDTH: 1400,
} as const;

/** 3D 场景布局常量 */
export const SCENE_LAYOUT = {
  /** 基准宽度单位 - 用于计算3D场景中元素的比例 */
  BASE_WIDTH_UNITS: 8,
  /** 深度间距 - 控制层级之间的Z轴距离，影响3D层次感 */
  DEPTH_GAP: 1,
  /** 最小宽度限制 - 防除零宽度导致的渲染问题 */
  MIN_WIDTH: 1,
  /** 最小高度限制 - 防除零高度导致的渲染问题 */
  MIN_HEIGHT: 1,
} as const;

/** Three.js 渲染器配置常量 */
export const RENDERER_CONFIG = {
  /** 默认画布宽度 - 模态框内的默认渲染尺寸 */
  DEFAULT_CANVAS_WIDTH: 960,
  /** 默认画布高度 - 模态框内的默认渲染尺寸 */
  DEFAULT_CANVAS_HEIGHT: 540,
  /** 设备像素比 - 默认使用1，可通过window.devicePixelRatio覆盖 */
  DEFAULT_PIXEL_RATIO: 1,
  /** 抗锯齿启用 - 提高渲染质量 */
  ANTIALIAS: true,
  /** Alpha通道启用 - 支持透明背景 */
  ALPHA: true,
  /** 保持绘制缓冲 - 用于截图和纹理生成 */
  PRESERVE_DRAWING_BUFFER: true,
  /** 清除颜色 - 白色背景 */
  CLEAR_COLOR: 0xffffff,
  /** 清除颜色透明度 - 完全不透明 */
  CLEAR_ALPHA: 1,
} as const;

/** Three.js 相机配置常量 */
export const CAMERA_CONFIG = {
  /** 视野角度 - 45度提供自然的透视效果 */
  FIELD_OF_VIEW: 45,
  /** 最近裁剪面 - 控制相机能看到的最近距离 */
  NEAR_PLANE: 0.1,
  /** 最远裁剪面 - 控制相机能看到的最远距离 */
  FAR_PLANE: 200,
  /** 相机初始位置X - 居中 */
  POSITION_X: 0,
  /** 相机初始位置Y - 自动计算 */
  POSITION_Y: 0,
  /** 相机初始位置Z - 自动计算 */
  POSITION_Z: 0,
  /** 视角高度偏移比例 - 相机相对于场景中心的高度比例 */
  VIEW_HEIGHT_RATIO: 0.8,
  /** 视角距离比例 - 相机距离与场景尺寸的比例 */
  VIEW_DISTANCE_RATIO: 2.5,
  /** 默认俯仰角度度 - 45度俯视角 */
  DEFAULT_PITCH_ANGLE: 45,
} as const;

/** Three.js 轨道控制器配置常量 */
export const ORBIT_CONTROLS_CONFIG = {
  /** 启用阻尼 - 提供更平滑的交互体验 */
  ENABLE_DAMPING: true,
  /** 阻尼系数 - 控制阻尼强度，值越大阻尼越强 */
  DAMPING_FACTOR: 0.08,
  /** 旋转速度 - 控制鼠标拖拽旋转的灵敏度 */
  ROTATE_SPEED: 0.6,
  /** 平移速度 - 控制鼠标拖拽平移的灵敏度 */
  PAN_SPEED: 0.3,
  /** 最小观察距离 - 防止相机过度靠近场景 */
  MIN_DISTANCE: 1,
  /** 最大观察距离 - 防止相机过度远离场景 */
  MAX_DISTANCE: 50,
  /** 最小距离比例 - 相对于场景计算的最小距离比例 */
  MIN_DISTANCE_RATIO: 0.5,
  /** 最大距离比例 - 相对于场景计算的最大距离比例 */
  MAX_DISTANCE_RATIO: 8,
} as const;

/** Three.js 灯光配置常量 */
export const LIGHTING_CONFIG = {
  /** 环境光颜色 - 白色 */
  AMBIENT_COLOR: 0xffffff,
  /** 环境光强度 - 提供基础照明，强度适中 */
  AMBIENT_INTENSITY: 0.9,
  /** 方向光颜色 - 白色 */
  DIRECTIONAL_COLOR: 0xffffff,
  /** 方向光强度 - 提供主要照明和阴影效果 */
  DIRECTIONAL_INTENSITY: 0.6,
  /** 方向光位置X - 从右方照射 */
  DIRECTIONAL_POSITION_X: 6,
  /** 方向光位置Y - 从上方照射 */
  DIRECTIONAL_POSITION_Y: 10,
  /** 方向光位置Z - 从前方照射 */
  DIRECTIONAL_POSITION_Z: 8,
} as const;

/** 3D 面板材质配置常量 */
export const PANEL_MATERIAL_CONFIG = {
  /** 透明度 - 半透明效果 */
  OPACITY: 0.95,
  /** HSL色相步长 - 用于不同深度的颜色区分 */
  HSL_HUE_STEP: 45,
  /** HSL饱和度 - 中等饱和度 */
  HSL_SATURATION: 45,
  /** HSL亮度 - 较亮的颜色 */
  HSL_LIGHTNESS: 80,
  /** 侧面渲染 - 双面渲染确保所有角度都可见 */
  SIDE: THREE.DoubleSide,
} as const;

/** 3D 边框线配置常量 */
export const EDGE_CONFIG = {
  /** 边框宽度比例 - 相对于面板厚度的比例 */
  WIDTH_RATIO: 0.01,
  /** 边框颜色 - 蓝色调 */
  COLOR: 0x60a5fa,
  /** 色相偏移步长 - 用于不同深度的边框颜色区分 */
  HSL_OFFSET_STEP: 0.04,
  /** 线条材质类型 - 基础线条材质 */
  LINE_TYPE: 'basic' as const,
} as const;

/** 3D 标签配置常量 */
export const LABEL_3D_CONFIG = {
  /** 标签画布宽度 - 256px提供清晰的文字渲染 */
  CANVAS_WIDTH: 256,
  /** 标签画布高度 - 64px适合单行文字 */
  CANVAS_HEIGHT: 64,
  /** 标签圆角半径 - 14px提供圆角效果 */
  CORNER_RADIUS: 14,
  /** 标签内边距 - 8px提供合适的留白 */
  PADDING: 8,
  /** 边框线宽 - 2px清晰的边框 */
  BORDER_WIDTH: 2,
  /** 字体大小 - 24px大字体确保可读性 */
  FONT_SIZE: 24,
  /** 字体样式 - 粗体sans-serif */
  FONT_STYLE: 'bold 24px sans-serif',
  /** 标签垂直偏移比例 - 相对于面板高度的比例 */
  VERTICAL_OFFSET_RATIO: 0.05,
  /** 标签缩放比例 - 基于面板尺寸的缩放 */
  SCALE_RATIO: 0.15,
} as const;

/** html2canvas 配置常量 */
export const HTML2CANVAS_CONFIG = {
  /** 缩放比例 - 2倍缩放提供高清纹理 */
  SCALE: 2,
  /** 背景颜色 - 白色背景 */
  BACKGROUND_COLOR: '#ffffff',
  /** 启用CORS - 支持跨域图片 */
  USE_CORS: true,
  /** 允许污染 - 处理跨域图片 */
  ALLOW_TAINT: true,
  /** 日志级别 - 关闭日志减少控制台输出 */
  LOGGING: false,
  /** 是否移除容器 - 不移除，手动管理DOM清理 */
  REMOVE_CONTAINER: false,
} as const;

/** DOM 临时容器配置常量 */
export const TEMP_CONTAINER_CONFIG = {
  /** 隐藏位置 - 屏幕左侧外 */
  HIDDEN_LEFT: '-200vw',
  /** 隐藏位置 - 屏幕上方外 */
  HIDDEN_TOP: '-200vh',
  /** 透明度 - 完全透明 */
  OPACITY: 0,
} as const;

/** 3D 场景深度计算配置常量 */
export const DEPTH_CALCULATION = {
  /** 深度偏移比例 - 相对于深度间距的比例 */
  DEPTH_OFFSET_RATIO: 0.05,
  /** 深度间距最小值比例 - 确保最小层次感 */
  MIN_DEPTH_GAP_RATIO: 0.25,
  /** 层级方向 - 正数表示向前叠加（用户方向），负数表示向后叠加 */
  LAYER_DIRECTION: 1,
} as const;

/** 加载状态配置常量 */
export const LOADING_CONFIG = {
  /** 加载提示文本 */
  SPIN_TIP: '生成 3D 视图中...',
  /** 背景模糊半径 - 提供毛玻璃效果 */
  BACKDROP_BLUR: '6px',
  /** 背景透明度 - 半透明白色背景 */
  BACKGROUND_OPACITY: 0.75,
} as const;

/** 颜色配置常量 */
export const COLOR_CONFIG = {
  /** 模态框内容背景色 */
  MODAL_CONTENT_BG: 'rgb(255, 255, 255)',
  /** 模态框头部背景色 */
  MODAL_HEADER_BG: 'rgb(255, 255, 255)',
  /** 模态框头部边框色 */
  MODAL_HEADER_BORDER: 'rgba(15,23,42,0.08)',
  /** 模态框头部文字颜色 */
  MODAL_HEADER_TEXT: 'rgb(15, 23, 42)',
  /** 模态框背景色 */
  MODAL_BG: 'rgb(248, 250, 252)',
  /** 标签背景色 */
  LABEL_BG: 'rgba(255, 255, 255, 0.95)',
  /** 标签边框色 */
  LABEL_BORDER: 'rgb(59, 130, 246)',
  /** 标签文字颜色 */
  LABEL_TEXT: 'rgb(31, 41, 55)',
} as const;