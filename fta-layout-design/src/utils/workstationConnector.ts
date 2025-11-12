import { callService as originCallService, TCallServiceFunc } from '@fta/workstation-connector';

// 判断是否在 VSCode 环境下，通过 window.acquireVsCodeApi 判断
export const isInVscode: boolean = typeof (window as any).acquireVsCodeApi === 'function';

// 包装 callService，只有在 VSCode 环境下才调用原生方法，否则返回 null
export const callService: TCallServiceFunc | undefined = isInVscode ? originCallService : undefined;
