import nodes1 from './nodes1.json';
import nodes2 from './nodes2.json';

type NodeWithId = {
  id: string;
};

const collectIds = (list: NodeWithId[] = []): Set<string> => {
  const ids = new Set<string>();

  list.forEach((item) => ids.add(item.id));
  return ids;
};

const ids1 = collectIds(nodes1 as NodeWithId[]);
const ids2 = collectIds(nodes2 as NodeWithId[]);

const onlyInNodes1 = [...ids1].filter((id) => !ids2.has(id));
const onlyInNodes2 = [...ids2].filter((id) => !ids1.has(id));

console.log('nodes1 length:', nodes1.length);
console.log('nodes2 length:', nodes2.length);
console.log('ids1 length:', ids1.size);
console.log('ids2 length:', ids2.size);

console.log('Only in nodes1:', onlyInNodes1);
console.log('Only in nodes2:', onlyInNodes2);
