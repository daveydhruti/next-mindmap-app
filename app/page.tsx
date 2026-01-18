// app/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Menu, Download, Upload } from 'lucide-react';

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
  connections: number[];
}

export default function MindMapPage() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 1, x: 400, y: 300, label: 'Untitled', connections: [] }
  ]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: number } | null>(null);
  const [editDialog, setEditDialog] = useState<{ nodeId: number; currentLabel: string } | null>(null);
  const [editInput, setEditInput] = useState('');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId);
        if (target) {
          // Calculate the center of the circles (accounting for text above)
          const nodeCenterY = node.y + 14; // 14px offset for text height
          const targetCenterY = target.y + 14;
          
          ctx.beginPath();
          ctx.moveTo(node.x, nodeCenterY);
          ctx.lineTo(target.x, targetCenterY);
          ctx.strokeStyle = '#4a5568';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });
  }, [nodes, canvasSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode !== null) {
        deleteNode(selectedNode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: number) => {
    if (e.button !== 0) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragging(nodeId);
    setOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setNodes(prev => prev.map(node => 
        node.id === dragging 
          ? { ...node, x: e.clientX - offset.x, y: e.clientY - offset.y }
          : node
      ));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: number) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
  };

  const addChildNode = (parentId: number) => {
    const newId = Math.max(...nodes.map(n => n.id), 0) + 1;
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;
    
    const existingChildren = nodes.filter(n => n.connections.includes(parentId));
    const angle = (existingChildren.length * Math.PI / 3) + Math.random() * 0.5;
    const distance = 150;
    
    const newNode: Node = {
      id: newId,
      x: parentNode.x + Math.cos(angle) * distance,
      y: parentNode.y + Math.sin(angle) * distance,
      label: `Untitled ${newId}`,
      connections: [parentId]
    };

    setNodes(prev => [
      ...prev.map(n => n.id === parentId ? { ...n, connections: [...n.connections, newId] } : n),
      newNode
    ]);
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const deleteNode = (nodeId: number) => {
    if (nodes.length === 1) {
      alert('Cannot delete the last node!');
      setContextMenu(null);
      return;
    }

    setNodes(prev => prev
      .filter(n => n.id !== nodeId)
      .map(n => ({
        ...n,
        connections: n.connections.filter(id => id !== nodeId)
      }))
    );
    setContextMenu(null);
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleCanvasClick = () => {
    setContextMenu(null);
    setSelectedNode(null);
    setMenuOpen(false);
  };

  const editLabel = (nodeId: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditDialog({ nodeId, currentLabel: node.label });
      setEditInput(node.label);
    }
    setContextMenu(null);
  };

  const handleEditSubmit = () => {
    if (editDialog && editInput.trim()) {
      setNodes(prev => prev.map(n => 
        n.id === editDialog.nodeId ? { ...n, label: editInput.trim() } : n
      ));
    } 
    setEditDialog(null);
    setEditInput('');
  };

  const handleEditCancel = () => {
    setEditDialog(null);
    setEditInput('');
  };

  const exportData = () => {
    const data = {
      nodes: nodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        label: node.label,
        connections: node.connections
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes && Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          setSelectedNode(null);
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error reading file');
      }
    };
    reader.readAsText(file);
    setMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="w-full h-screen bg-gray-900 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {nodes.map(node => (
        <div
          key={node.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move animate-fadeIn ${
            dragging === node.id ? '' : 'transition-all duration-200'
          }`}
          style={{ 
            left: node.x, 
            top: node.y
          }}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
          onClick={(e) => handleNodeClick(e, node.id)}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
          onDoubleClick={() => editLabel(node.id)}
        >
          <div className="flex flex-col items-center">
            <span className="text-white text-sm font-medium select-none mb-2 whitespace-nowrap">
              {node.label}
            </span>
            <div className={`w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl hover:scale-125 transition-all duration-200 ${
              selectedNode === node.id ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''
            }`} />
          </div>
        </div>
      ))}

      {selectedNode && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 px-6 py-3 rounded-lg shadow-xl border border-gray-700">
          <p className="text-white text-sm mb-2">
            Selected: <span className="font-bold">{nodes.find(n => n.id === selectedNode)?.label}</span>
          </p>
          <button
            onClick={() => addChildNode(selectedNode)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 w-full justify-center"
          >
            <Plus size={20} />
            <span className="font-medium">Add Child Node</span>
          </button>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              addChildNode(contextMenu.nodeId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
          >
            Add Child Node
          </button>
          <button
            onClick={() => editLabel(contextMenu.nodeId)}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
          >
            Edit Label
          </button>
          <button
            onClick={() => deleteNode(contextMenu.nodeId)}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors"
          >
            Delete Node
          </button>
        </div>
      )}

      <div className="fixed top-4 left-4 bg-gray-800 px-4 py-3 rounded-lg shadow-lg border border-gray-700">
        <p className="text-white text-lg">
          <strong>Mind map app</strong>
        </p>
        <p className="text-grey-800 text-sm">
          <strong className="text-white">Tip:</strong> Click a node to select it, then add children
        </p>
      </div>

      <div className="fixed top-4 right-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-12 h-12 bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center border border-gray-700"
        >
          <Menu size={24} />
        </button>

        {menuOpen && (
          <div className="absolute top-16 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[150px]">
            <button
              onClick={exportData}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Upload size={18} />
              Import
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importData}
        className="hidden"
      />

      {editDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6 w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Edit Node Label</h3>
            <input
              type="text"
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
                if (e.key === 'Escape') handleEditCancel();
              }}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              placeholder="Enter new label"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}