import { proxy } from 'valtio';
import { TodoItem } from '../services/types';

export interface ThoughtChainItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'success' | 'error';
  content?: string;
  startedAt?: string;
  finishedAt?: string;
  kind?: 'iteration' | 'task' | 'text';
}

export type GenerationStatus = 'idle' | 'generating' | 'completed' | 'failed';

interface CodeGenerationState {
  isDrawerOpen: boolean;
  generationStatus: GenerationStatus;
  thoughtChainItems: ThoughtChainItem[];
  currentSessionId: string | null;
  currentIteration: number;
}

export const codeGenerationStore = proxy<CodeGenerationState>({
  isDrawerOpen: false,
  generationStatus: 'idle',
  thoughtChainItems: [],
  currentSessionId: null,
  currentIteration: 0,
});

export const codeGenerationActions = {
  openDrawer: () => {
    codeGenerationStore.isDrawerOpen = true;
  },
  closeDrawer: () => {
    codeGenerationStore.isDrawerOpen = false;
  },
  startGeneration: (sessionId: string) => {
    codeGenerationStore.generationStatus = 'generating';
    codeGenerationStore.currentSessionId = sessionId;
    codeGenerationStore.currentIteration = 0;
  },
  setGenerationStatus: (status: GenerationStatus) => {
    codeGenerationStore.generationStatus = status;
  },
  addThoughtItem: (item: ThoughtChainItem) => {
    codeGenerationStore.thoughtChainItems = [...codeGenerationStore.thoughtChainItems, item];
  },
  updateThoughtItem: (id: string, updates: Partial<ThoughtChainItem>) => {
    codeGenerationStore.thoughtChainItems = codeGenerationStore.thoughtChainItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
  },
  appendToThoughtContent: (id: string, text: string) => {
    codeGenerationStore.thoughtChainItems = codeGenerationStore.thoughtChainItems.map((item) => {
      if (item.id !== id) return item;
      const content = (item.content || '') + text;
      const status = item.status === 'pending' && text.trim() ? 'in_progress' : item.status;
      return {
        ...item,
        content,
        status,
      };
    });
  },
  clearThoughtChain: () => {
    codeGenerationStore.thoughtChainItems = [];
    codeGenerationStore.currentIteration = 0;
  },
  setCurrentIteration: (iteration: number) => {
    codeGenerationStore.currentIteration = iteration;
  },
  updateTodos: (todos: TodoItem[]) => {
    if (!todos || todos.length === 0) return;

    const previousItems = [...codeGenerationStore.thoughtChainItems];
    const now = new Date().toISOString();

    const todoItems: ThoughtChainItem[] = todos.map((todo) => {
      const todoId = `task-${todo.id || Date.now()}`;
      const existing = previousItems.find((item) => item.id === todoId);

      let status: ThoughtChainItem['status'] = 'pending';
      if (todo.status === 'completed') {
        status = 'success';
      } else if (todo.status === 'in_progress') {
        status = 'in_progress';
      }

      let finishedAt: string | undefined;
      if (existing?.finishedAt) {
        finishedAt = existing.finishedAt;
      } else if (status === 'success') {
        finishedAt = now;
      } else {
        finishedAt = undefined;
      }

      return {
        id: todoId,
        title: todo.content || 'Task',
        status,
        content: todo.content || existing?.content || '',
        startedAt: existing?.startedAt || now,
        finishedAt,
        kind: 'task',
      };
    });

    const nonTasks = previousItems.filter((item) => item.kind !== 'task');

    const mergedTasks = todoItems.map((newTask) => {
      const existingTask = previousItems.find((item) => item.id === newTask.id);
      return existingTask ? { ...existingTask, ...newTask } : newTask;
    });

    codeGenerationStore.thoughtChainItems = [...nonTasks, ...mergedTasks];
  },
};
