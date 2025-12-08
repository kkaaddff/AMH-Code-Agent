/**
 *{
 *    promptTokens: 36124,
 *    completionTokens: 378,
 *    totalTokens: 36502
 * }
 *
 * {
 *    promptTokens: 31166,
 *    completionTokens: 431,
 *    totalTokens: 31597
 * }
 *
 */
import { DSLData, DSLNode } from '@fta/shared';
import { minifyNodes } from './nodes';
import { minifyStyles } from './styles';

export const minifyDSL = (dsl: DSLData): DSLData => {
  // 1. Minify Styles
  const { minifiedStyles, styleMap } = minifyStyles(dsl.styles || {});

  // 2. Minify Nodes
  // We handle both 'nodes' (array) or single root node if structure differs
  let minifiedNodes: DSLNode[] = [];
  if (Array.isArray(dsl.nodes)) {
    minifiedNodes = minifyNodes(dsl.nodes, styleMap);
  } else {
    // Fallback or empty
    minifiedNodes = [];
  }

  // 3. Construct Result
  const result: DSLData = {
    ...dsl, // Keep other top-level props
    styles: minifiedStyles,
    nodes: minifiedNodes,
  };

  // Remove empty styles if any (though we usually have some)
  if (Object.keys(minifiedStyles).length === 0) {
    delete result.styles;
  }

  return result;
};
