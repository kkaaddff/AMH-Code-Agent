import React, { useState, useEffect } from 'react';
import DSLElement from './components/DSLElement';
import { DesignData } from '@fta/shared-types';
import dslRawData from './data/dsl.json';
import { DSLCleaner } from './utils/DSLCleaner';
import './App.css';

const App: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dsls, setDsls] = useState<{ raw: DesignData; cleaned: DesignData } | null>(null);

  useEffect(() => {
    // Load DSL data - the JSON has styles and nodes at root level, need to wrap in dsl property
    const dslData: DesignData = {
      dsl: {
        styles: dslRawData.styles,
        nodes: dslRawData.nodes as any,
      },
    };

    // 清洗 DSL 数据
    const cleaner = new DSLCleaner({
      removeEmptyNodes: true,
      detectIcons: false,
      iconMaxSize: 80,
      verbose: true,
    });
    const result = cleaner.clean(dslData);

    console.log(`节点数量: ${result.statistics.nodeCountBefore} → ${result.statistics.nodeCountAfter}`);
    // 使用清洗后的节点更新 DSL 数据
    const cleanedDslData: DesignData = {
      dsl: {
        styles: dslData.dsl.styles,
        nodes: result.nodes as any,
      },
    };

    setDsls({ raw: dslData, cleaned: cleanedDslData });
  }, []);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    console.log('Selected node:', nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  };

  if (!dsls) {
    return <div className='loading'>Loading DSL data...</div>;
  }

  const renderCanvas = (title: string, data: DesignData) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>{title}</h3>
      <div className='canvas-container' style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div
          style={{
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            width: '200%', // Compensate for scale(0.5) to fill width
            height: '200%', // Compensate for scale(0.5) to fill height if needed, or let content flow
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

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>DSL Element Demo</h1>
        <p>Click on elements to select them</p>
      </header>

      <main className='app-main' style={{ gap: '2rem' }}>
        {renderCanvas('Before (Raw)', dsls.raw)}
        {renderCanvas('After (Cleaned)', dsls.cleaned)}

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
                <strong>Nodes:</strong> {dsls.raw.dsl.nodes.length}
              </p>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h4>Cleaned</h4>
              <p>
                <strong>Nodes:</strong> {dsls.cleaned.dsl.nodes.length}
              </p>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p>
                <strong>Styles:</strong> {Object.keys(dsls.raw.dsl.styles).length}
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
