import React, { createContext, useContext, useState, useCallback } from 'react';
import { TodoItem } from '../utils/CodeGenerationLoop/types';

export interface ThoughtChainItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'success' | 'error';
  content?: string;
  startedAt?: string;
  finishedAt?: string;
  kind?: 'iteration' | 'task' | 'text';
}

interface CodeGenerationContextValue {
  // 抽屉状态
  isDrawerOpen: boolean;
  isGenerating: boolean;
  
  // 思维链数据
  thoughtChainItems: ThoughtChainItem[];
  
  // 会话信息
  currentSessionId: string | null;
  currentIteration: number;
  
  // 操作方法
  openDrawer: () => void;
  closeDrawer: () => void;
  startGeneration: (sessionId: string) => void;
  stopGeneration: () => void;
  
  // 更新思维链
  addThoughtItem: (item: ThoughtChainItem) => void;
  updateThoughtItem: (id: string, updates: Partial<ThoughtChainItem>) => void;
  appendToThoughtContent: (id: string, text: string) => void;
  clearThoughtChain: () => void;
  
  // 更新迭代信息
  setCurrentIteration: (iteration: number) => void;
  
  // 处理 TODO 更新
  updateTodos: (todos: TodoItem[]) => void;
}

const CodeGenerationContext = createContext<CodeGenerationContextValue | null>(null);

export const CodeGenerationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [thoughtChainItems, setThoughtChainItems] = useState<ThoughtChainItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentIteration, setCurrentIteration] = useState(0);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const startGeneration = useCallback((sessionId: string) => {
    setIsGenerating(true);
    setCurrentSessionId(sessionId);
    setCurrentIteration(0);
  }, []);

  const stopGeneration = useCallback(() => {
    setIsGenerating(false);
  }, []);

  const addThoughtItem = useCallback((item: ThoughtChainItem) => {
    setThoughtChainItems((prev) => [...prev, item]);
  }, []);

  const updateThoughtItem = useCallback((id: string, updates: Partial<ThoughtChainItem>) => {
    setThoughtChainItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const appendToThoughtContent = useCallback((id: string, text: string) => {
    setThoughtChainItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          content: (item.content || '') + text,
          status: item.status === 'pending' && text.trim() ? 'in_progress' : item.status,
        };
      })
    );
  }, []);

  const clearThoughtChain = useCallback(() => {
    setThoughtChainItems([]);
    setCurrentIteration(0);
  }, []);

  const updateTodos = useCallback((todos: TodoItem[]) => {
    if (!todos || todos.length === 0) return;

    setThoughtChainItems((prev) => {
      const now = new Date().toISOString();
      const existingTodoIds = new Set(prev.filter((item) => item.kind === 'task').map((item) => item.id));

      const todoItems: ThoughtChainItem[] = todos.map((todo): ThoughtChainItem => {
        const todoId = `task-${todo.id || Date.now()}`;
        const existing = prev.find((item) => item.id === todoId);
        
        let status: ThoughtChainItem['status'] = 'pending';
        if (todo.status === 'completed') status = 'success';
        else if (todo.status === 'in_progress') status = 'in_progress';

        return {
          id: todoId,
          title: todo.activeForm || todo.content || '任务',
          status,
          content: todo.content || existing?.content || '',
          startedAt: existing?.startedAt || now,
          finishedAt: status === 'success' ? now : undefined,
          kind: 'task',
        };
      });

      // 保留非 task 类型的项，和已存在的 task
      const nonTasks = prev.filter((item) => item.kind !== 'task');
      
      // 合并新旧 task
      const mergedTasks = todoItems.map((newTask) => {
        const existingTask = prev.find((item) => item.id === newTask.id);
        return existingTask ? { ...existingTask, ...newTask } : newTask;
      });

      return [...nonTasks, ...mergedTasks];
    });
  }, []);

  const value: CodeGenerationContextValue = {
    isDrawerOpen,
    isGenerating,
    thoughtChainItems,
    currentSessionId,
    currentIteration,
    openDrawer,
    closeDrawer,
    startGeneration,
    stopGeneration,
    addThoughtItem,
    updateThoughtItem,
    appendToThoughtContent,
    clearThoughtChain,
    setCurrentIteration,
    updateTodos,
  };

  return <CodeGenerationContext.Provider value={value}>{children}</CodeGenerationContext.Provider>;
};

export const useCodeGeneration = () => {
  const context = useContext(CodeGenerationContext);
  if (!context) {
    throw new Error('useCodeGeneration must be used within a CodeGenerationProvider');
  }
  return context;
};

