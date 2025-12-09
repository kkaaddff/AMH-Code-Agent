/**
 * SVG Path 工具函数
 * 用于解析 SVG path data 并计算边界框
 */

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export type PathTransform = {
  x?: number;
  y?: number;
  rotate?: number;
};

/**
 * 解析 SVG path data 字符串，提取所有坐标点
 * 支持常见的 SVG path 命令：M, L, H, V, C, S, Q, T, A, Z
 */
function extractPathCoordinates(pathData: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  // 匹配数字（包括负数和小数）
  const numberPattern = /-?[\d.]+(?:e[-+]?\d+)?/gi;

  // 分割命令和参数
  // SVG path 命令: M, m, L, l, H, h, V, v, C, c, S, s, Q, q, T, t, A, a, Z, z
  const commandPattern = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;

  let currentX = 0;
  let currentY = 0;
  let match;

  while ((match = commandPattern.exec(pathData)) !== null) {
    const command = match[1];
    const argsStr = match[2];
    const numbers = argsStr.match(numberPattern)?.map(Number) || [];

    const isRelative = command === command.toLowerCase();
    const cmd = command.toUpperCase();

    let i = 0;
    while (i < numbers.length || (numbers.length === 0 && cmd !== 'Z')) {
      switch (cmd) {
        case 'M': // moveto
        case 'L': // lineto
          if (i + 1 < numbers.length) {
            if (isRelative) {
              currentX += numbers[i];
              currentY += numbers[i + 1];
            } else {
              currentX = numbers[i];
              currentY = numbers[i + 1];
            }
            points.push({ x: currentX, y: currentY });
            i += 2;
          } else {
            i = numbers.length;
          }
          break;

        case 'H': // horizontal lineto
          if (i < numbers.length) {
            if (isRelative) {
              currentX += numbers[i];
            } else {
              currentX = numbers[i];
            }
            points.push({ x: currentX, y: currentY });
            i += 1;
          } else {
            i = numbers.length;
          }
          break;

        case 'V': // vertical lineto
          if (i < numbers.length) {
            if (isRelative) {
              currentY += numbers[i];
            } else {
              currentY = numbers[i];
            }
            points.push({ x: currentX, y: currentY });
            i += 1;
          } else {
            i = numbers.length;
          }
          break;

        case 'C': // curveto (cubic Bézier)
          // 6 个参数: x1, y1, x2, y2, x, y
          if (i + 5 < numbers.length) {
            const x1 = isRelative ? currentX + numbers[i] : numbers[i];
            const y1 = isRelative ? currentY + numbers[i + 1] : numbers[i + 1];
            const x2 = isRelative ? currentX + numbers[i + 2] : numbers[i + 2];
            const y2 = isRelative ? currentY + numbers[i + 3] : numbers[i + 3];
            const x = isRelative ? currentX + numbers[i + 4] : numbers[i + 4];
            const y = isRelative ? currentY + numbers[i + 5] : numbers[i + 5];

            // 添加控制点和终点以确保边界框正确
            points.push({ x: x1, y: y1 });
            points.push({ x: x2, y: y2 });
            points.push({ x, y });

            currentX = x;
            currentY = y;
            i += 6;
          } else {
            i = numbers.length;
          }
          break;

        case 'S': // smooth curveto
          // 4 个参数: x2, y2, x, y
          if (i + 3 < numbers.length) {
            const x2 = isRelative ? currentX + numbers[i] : numbers[i];
            const y2 = isRelative ? currentY + numbers[i + 1] : numbers[i + 1];
            const x = isRelative ? currentX + numbers[i + 2] : numbers[i + 2];
            const y = isRelative ? currentY + numbers[i + 3] : numbers[i + 3];

            points.push({ x: x2, y: y2 });
            points.push({ x, y });

            currentX = x;
            currentY = y;
            i += 4;
          } else {
            i = numbers.length;
          }
          break;

        case 'Q': // quadratic Bézier curveto
          // 4 个参数: x1, y1, x, y
          if (i + 3 < numbers.length) {
            const x1 = isRelative ? currentX + numbers[i] : numbers[i];
            const y1 = isRelative ? currentY + numbers[i + 1] : numbers[i + 1];
            const x = isRelative ? currentX + numbers[i + 2] : numbers[i + 2];
            const y = isRelative ? currentY + numbers[i + 3] : numbers[i + 3];

            points.push({ x: x1, y: y1 });
            points.push({ x, y });

            currentX = x;
            currentY = y;
            i += 4;
          } else {
            i = numbers.length;
          }
          break;

        case 'T': // smooth quadratic Bézier curveto
          // 2 个参数: x, y
          if (i + 1 < numbers.length) {
            if (isRelative) {
              currentX += numbers[i];
              currentY += numbers[i + 1];
            } else {
              currentX = numbers[i];
              currentY = numbers[i + 1];
            }
            points.push({ x: currentX, y: currentY });
            i += 2;
          } else {
            i = numbers.length;
          }
          break;

        case 'A': // elliptical Arc
          // 7 个参数: rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y
          if (i + 6 < numbers.length) {
            if (isRelative) {
              currentX += numbers[i + 5];
              currentY += numbers[i + 6];
            } else {
              currentX = numbers[i + 5];
              currentY = numbers[i + 6];
            }
            points.push({ x: currentX, y: currentY });
            i += 7;
          } else {
            i = numbers.length;
          }
          break;

        case 'Z': // closepath
          i = numbers.length; // 退出循环
          break;

        default:
          i = numbers.length;
          break;
      }

      // 如果没有参数，退出
      if (numbers.length === 0) break;
    }
  }

  return points;
}

/**
 * 计算 SVG path data 的边界框
 * @param pathData SVG path 的 d 属性值
 * @returns 边界框对象，包含 minX, minY, maxX, maxY, width, height
 */
export function getPathBoundingBox(pathData: string): BoundingBox {
  const points = extractPathCoordinates(pathData);

  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export const normalizeTransform = (t?: PathTransform): Required<PathTransform> => ({
  x: t?.x ?? 0,
  y: t?.y ?? 0,
  rotate: t?.rotate ?? 0,
});
/**
 * 对 bbox 应用 translate + rotate 变换，返回新的 bbox
 */
export function applyTransformToBoundingBox(bbox: BoundingBox, transform?: PathTransform): BoundingBox {
  const { x, y } = normalizeTransform(transform);

  const minX = bbox.minX + x;
  const minY = bbox.minY + y;
  const maxX = bbox.maxX + x;
  const maxY = bbox.maxY + y;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  //! 考虑旋转会导致 bbox 被扩大，从而影响内部 svg 尺寸的绘制
  // if (rotate === 0) {
  // }

  // const rad = (rotate * Math.PI) / 180;
  // const cos = Math.cos(rad);
  // const sin = Math.sin(rad);
  // const corners = [
  //   { x: bbox.minX, y: bbox.minY },
  //   { x: bbox.maxX, y: bbox.minY },
  //   { x: bbox.minX, y: bbox.maxY },
  //   { x: bbox.maxX, y: bbox.maxY },
  // ];

  // const rotated = corners.map(({ x: cx, y: cy }) => ({
  //   x: cx * cos - cy * sin + x,
  //   y: cx * sin + cy * cos + y,
  // }));

  // const minX = Math.min(...rotated.map((p) => p.x));
  // const minY = Math.min(...rotated.map((p) => p.y));
  // const maxX = Math.max(...rotated.map((p) => p.x));
  // const maxY = Math.max(...rotated.map((p) => p.y));

  // return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * 计算 path 的 viewBox 字符串
 * @param pathData SVG path 的 d 属性值
 * @returns viewBox 字符串 "minX minY width height"
 */
export function getPathViewBox(pathData: string): string {
  const bbox = getPathBoundingBox(pathData);

  // 如果边界框无效，返回默认值
  if (bbox.width === 0 && bbox.height === 0) {
    return '0 0 100 100';
  }

  return `${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`;
}
