// FTA 组件库配置（参考 UI.html 中的组件定义）
export const FTA_COMPONENTS = {
  '基础原子组件': [
    'Button',
    'Icon',
    'Text',
    'Avatar',
    'Badge',
    'Tag',
    'Image',
    'ProgressBar',
    'CircularProgress',
    'InputNumber',
    'Radio',
    'Toggle',
    'Divider',
    'Loading',
  ],
  '带有插槽的复杂组件': [
    'Card',
    'ListItem',
    'NavBar',
    'FormItem',
    'Input',
    'Search',
    'Collapse',
    'Timeline.Item',
    'Result',
    'Modal',
  ],
  '复杂整体业务组件': [
    'AddressPicker',
    'CarKeyboard',
    'ImageUpload',
    'Calendar',
    'Cascader',
    'SelectorCore',
    'InfiniteScroll',
    'Lottie',
  ],
  '基础容器': [
    'Container',
    'Flex',
    'Grid',
  ],
} as const;

// 导出所有组件的扁平化列表
export const ALL_FTA_COMPONENTS = Object.values(FTA_COMPONENTS).flat();

// 导出组件分类名称
export const FTA_COMPONENT_CATEGORIES = Object.keys(FTA_COMPONENTS);

