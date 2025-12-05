import React, { useState, useEffect } from 'react';
import DSLElement from './components/DSLElement';
import { DesignData } from '@fta/shared-types';
import dslRawData from './data/dsl.json';
import './App.css';

const App: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dsl, setDsl] = useState<DesignData | null>(null);

  useEffect(() => {
    // Load DSL data - the JSON has styles and nodes at root level, need to wrap in dsl property
    const dslData: DesignData = {
      dsl: {
        styles: dslRawData.styles,
        nodes: dslRawData.nodes as any,
      },
    };
    setDsl(dslData);
  }, []);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    console.log('Selected node:', nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  };

  if (!dsl) {
    return <div className='loading'>Loading DSL data...</div>;
  }

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>DSL Element Demo</h1>
        <p>Click on elements to select them</p>
      </header>

      <main className='app-main'>
        <div className='canvas-container'>
          <div className='canvas'>
            <DSLElement
              dslData={dsl}
              onSelect={handleNodeSelect}
              onHover={handleNodeHover}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
            />
          </div>
        </div>

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
            <p>
              <strong>Total nodes:</strong> {dsl.dsl.nodes.length}
            </p>
            <p>
              <strong>Styles:</strong> {Object.keys(dsl.dsl.styles).length}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
