const root = {
  type: 'split',
  id: 'split-main',
  children: [
    { type: 'terminal', id: 'term-editor', startupCommand: 'aider' },
    { type: 'split', id: 'split-side', children: [
        { type: 'terminal', id: 'term-dev', startupCommand: 'npm run dev' },
        { type: 'terminal', id: 'term-shell' }
    ]}
  ]
};
const findTerminalNode = (node, targetId) => {
  if (!node) return null;
  if (node.type === 'terminal') {
    return node.id === targetId ? node : null;
  }
  return findTerminalNode(node.children[0], targetId) || findTerminalNode(node.children[1], targetId);
};
console.log(findTerminalNode(root, 'term-editor'));
console.log(findTerminalNode(root, 'term-dev'));
