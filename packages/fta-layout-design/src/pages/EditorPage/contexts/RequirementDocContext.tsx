import { proxy } from 'valtio';

interface RequirementDocState {
  docContent: string;
}

interface RequirementDocActions {
  setDocContent: (value: string | ((prev: string) => string)) => void;
}

type RequirementDocStore = ReturnType<typeof createRequirementDocStore>;

export const createRequirementDocStore = () =>
  proxy<RequirementDocState>({
    docContent: '',
  });

export const createRequirementDocActions = (store: RequirementDocStore): RequirementDocActions => ({
  setDocContent: (value) => {
    store.docContent = typeof value === 'function' ? value(store.docContent) : value;
  },
});
