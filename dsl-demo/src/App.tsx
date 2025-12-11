import type { CleanerConfig, Statistics } from '@fta/shared';
import { DesignData, DSLCleaner } from '@fta/shared';
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import DSL3DCompareModal from './components/DSL3DCompareModal';
import DSLElement from './components/DSLElement';
import dslRawData from './data/dsl.json';
import rootAnnotation from './data/rootAnnotation.json';
import { mergeDslWithAnnotation } from './utils/mergeDslAnnotation';
import type { MergedPageNode } from './types/merged';
import { estimateTokenDiff } from './utils/tokenEstimator';

const App: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dsls, setDsls] = useState<{
    raw: DesignData;
    statistics: Statistics;
    cleaned: DesignData;
  } | null>(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [merged, setMerged] = useState<MergedPageNode | null>(null);
  const [tokenStats, setTokenStats] = useState<{
    before: number;
    after: number;
    delta: number;
    saving: number;
  } | null>(null);

  useEffect(() => {
    // Load DSL data - the JSON has styles and nodes at root level, need to wrap in dsl property
    const dslData: DesignData = {
      dsl: {
        styles: dslRawData.styles,
        nodes: dslRawData.nodes as any,
      },
    };

    const cleanerConfig: CleanerConfig = {
      removeEmptyNodes: true,

      removeMaskLayers: true,
      removeOutOfBounds: true,
      removeInvisibleNodes: true,

      detectIcons: true,
      mergeIconLayers: true,
      iconMergeMaxSize: 40,
      iconMinLayers: 2,
      iconProximityThreshold: 10,

      buildZIndex: true,
      checkOverlapping: true,
      removeCompletelyHidden: true,

      flattenSingleChild: true,
      optimizeDepth: true,
      preserveSemantics: true,

      verbose: true,
      dryRun: false,
    };

    // 清洗 DSL 数据
    const cleaner = new DSLCleaner(cleanerConfig);
    const result = cleaner.clean(dslData.dsl.nodes[0]);

    console.log(`节点数量: ${result.statistics.nodeCountBefore} → ${result.statistics.nodeCountAfter}`);
    // 使用清洗后的节点更新 DSL 数据
    const cleanedDslData: DesignData = {
      dsl: {
        styles: dslData.dsl.styles,
        nodes: [result.root],
      },
    };

    setDsls({ raw: dslData, statistics: result.statistics, cleaned: cleanedDslData });
  }, []);

  useEffect(() => {
    const runMerge = async () => {
      if (!dsls) return;
      const { merged: mergedTree } = mergeDslWithAnnotation(dsls.cleaned, rootAnnotation as any);
      setMerged(mergedTree);

      const beforePrompt = JSON.stringify({ annotation: rootAnnotation, dsl: dsls.raw.dsl });
      const afterPrompt = JSON.stringify(mergedTree);
      const diff = await estimateTokenDiff(beforePrompt, afterPrompt);
      setTokenStats(diff);
    };
    void runMerge();
  }, [dsls]);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    console.log('Selected node:', nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  };

  const mergedPreview = useMemo(() => {
    if (!merged) return null;
    const renderNode = (node: MergedPageNode, depth = 0) => {
      const indent = depth * 12;
      return (
        <div key={node.nodeId} style={{ marginLeft: indent, marginBottom: 8 }}>
          <div>
            <strong>{node.componentName || node.type}</strong> ({node.type}) · extraVisuals: {node.extraVisuals.length}{' '}
            · layout: {node.layout.width}×{node.layout.height} @ {node.layout.absoluteX},{node.layout.absoluteY}
          </div>
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    };
    return renderNode(merged);
  }, [merged]);

  if (!dsls) {
    return <div className='loading'>Loading DSL data...</div>;
  }

  const renderCanvas = (title: string, data: DesignData, totalNodes: number) => {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>
          {title} ({totalNodes} nodes)
        </h3>
        <div className='canvas-container' style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <div
            style={{
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              width: '100%', // Compensate for scale(0.5) to fill width
              height: '100%', // Compensate for scale(0.5) to fill height if needed, or let content flow
            }}>
            <div className='canvas'>
              <DSLElement
                dslData={data}
                onSelect={handleNodeSelect}
                onHover={handleNodeHover}
                selectedNodeId={selectedNodeId}
                hoveredNodeId={hoveredNodeId}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>DSL Element Demo</h1>
        <p>Click on elements to select them</p>
        <button
          onClick={() => setIs3DModalOpen(true)}
          style={{
            marginTop: 10,
            padding: '8px 16px',
            background: '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
          }}>
          查看 3D 结构对比
        </button>
      </header>

      <main className='app-main' style={{ gap: '2rem' }}>
        {renderCanvas('Before (Raw)', dsls.raw, dsls.statistics.nodeCountBefore)}
        {renderCanvas('After (Cleaned)', dsls.cleaned, dsls.statistics.processedNodes)}

        <aside className='sidebar'>
          <h3>Node Info</h3>
          {selectedNodeId ? (
            <div className='node-info'>
              <p>
                <strong>Selected Node ID:</strong> {selectedNodeId}
              </p>
            </div>
          ) : (
            <p className='no-selection'>No node selected</p>
          )}

          <h3>DSL Structure</h3>
          <div className='dsl-info'>
            <div>
              <h4>Raw</h4>
              <p>
                <strong>Nodes:</strong> {dsls.statistics.nodeCountBefore}
              </p>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h4>Cleaned</h4>
              <p>
                <strong>Nodes:</strong> {dsls.statistics.processedNodes}
              </p>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p>
                <strong>Styles:</strong> {Object.keys(dsls.raw.dsl.styles).length}
              </p>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h4>Token (Qwen)</h4>
              {tokenStats ? (
                <>
                  <p>
                    <strong>Before:</strong> {tokenStats.before} · <strong>After:</strong> {tokenStats.after}
                  </p>
                  <p>
                    <strong>Delta:</strong> {tokenStats.delta} · <strong>Saving:</strong> {tokenStats.saving}
                  </p>
                </>
              ) : (
                <p>Estimating...</p>
              )}
            </div>
          </div>

          <h3>Merged Preview</h3>
          <div className='dsl-info' style={{ maxHeight: 320, overflow: 'auto' }}>
            {mergedPreview ?? <p>合并中...</p>}
          </div>
        </aside>
      </main>

      <DSL3DCompareModal
        open={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
        rawDsl={dsls.raw}
        cleanedDsl={dsls.cleaned}
      />
    </div>
  );
};

export default App;
