import { describe, it, expect } from 'vitest';
import {
  generateSolo,
  generate2Pane,
  generate3PaneTSplitTop,
  generate3PaneTSplitBottom,
  generate3Columns,
  generate3Rows,
  generate4PaneQuad,
  generate4PaneMasterDetail,
  generate4Columns,
  generate6PaneMatrix,
  generate6Command,
  generate8Fleet,
  generate8Satellite,
  generate9Hivemind,
  generate16GodMode,
  generateCustomMatrix,
} from './layoutGenerators';
import { PaneNode, TerminalNode } from '@/types/layout';

function countTerminals(node: PaneNode): number {
  if (node.type === 'terminal') return 1;
  return countTerminals(node.children[0]) + countTerminals(node.children[1]);
}

describe('layoutGenerators', () => {
  it('generates 1-Pane Solo Focus', () => {
    const tree = generateSolo();
    expect(tree.type).toBe('terminal');
    expect(countTerminals(tree)).toBe(1);
    expect((tree as TerminalNode).title).toBe('Main Terminal');
  });

  it('generates 2-Pane Horizontal and Vertical', () => {
    const hTree = generate2Pane('horizontal', 0.5);
    expect(hTree.type).toBe('split');
    if (hTree.type === 'split') {
      expect(hTree.direction).toBe('horizontal');
      expect(hTree.ratio).toBe(0.5);
    }
    expect(countTerminals(hTree)).toBe(2);

    const vTree = generate2Pane('vertical', 0.6);
    expect(vTree.type).toBe('split');
    if (vTree.type === 'split') {
      expect(vTree.direction).toBe('vertical');
      expect(vTree.ratio).toBe(0.6);
    }
    expect(countTerminals(vTree)).toBe(2);
  });

  it('generates 3-Pane T-Split Top & Bottom', () => {
    const topTree = generate3PaneTSplitTop(0.55);
    expect(countTerminals(topTree)).toBe(3);
    if (topTree.type === 'split') {
      expect(topTree.direction).toBe('vertical');
      expect(topTree.ratio).toBe(0.55);
    }

    const bottomTree = generate3PaneTSplitBottom(0.45);
    expect(countTerminals(bottomTree)).toBe(3);
    if (bottomTree.type === 'split') {
      expect(bottomTree.direction).toBe('vertical');
      expect(bottomTree.ratio).toBe(0.45);
    }
  });

  it('generates 3-Columns and 3-Rows', () => {
    const colTree = generate3Columns();
    expect(countTerminals(colTree)).toBe(3);
    if (colTree.type === 'split') {
      expect(colTree.direction).toBe('horizontal');
    }

    const rowTree = generate3Rows();
    expect(countTerminals(rowTree)).toBe(3);
    if (rowTree.type === 'split') {
      expect(rowTree.direction).toBe('vertical');
    }
  });

  it('generates 4-Quad 2x2, 4-Master Detail 1+3, and 4-Columns', () => {
    const quadTree = generate4PaneQuad();
    expect(countTerminals(quadTree)).toBe(4);

    const mdTree = generate4PaneMasterDetail(0.7);
    expect(countTerminals(mdTree)).toBe(4);
    if (mdTree.type === 'split') {
      expect(mdTree.ratio).toBe(0.7);
    }

    const col4Tree = generate4Columns();
    expect(countTerminals(col4Tree)).toBe(4);
  });

  it('generates 6-Matrix 2x3 and 6-Command 1+5', () => {
    const matrix6Tree = generate6PaneMatrix();
    expect(countTerminals(matrix6Tree)).toBe(6);

    const command6Tree = generate6Command(0.6);
    expect(countTerminals(command6Tree)).toBe(6);
    if (command6Tree.type === 'split') {
      expect(command6Tree.ratio).toBe(0.6);
      expect((command6Tree.children[0] as TerminalNode).title).toBe('Lead Orchestrator');
    }
  });

  it('generates 8-Fleet 2x4 and 8-Satellite 2+6', () => {
    const fleet8Tree = generate8Fleet();
    expect(countTerminals(fleet8Tree)).toBe(8);

    const sat8Tree = generate8Satellite(0.5);
    expect(countTerminals(sat8Tree)).toBe(8);
  });

  it('generates 9-Hivemind 3x3 and 16-GodMode 4x4', () => {
    const hive9Tree = generate9Hivemind();
    expect(countTerminals(hive9Tree)).toBe(9);

    const god16Tree = generate16GodMode();
    expect(countTerminals(god16Tree)).toBe(16);
  });

  it('generates custom matrices up to 8x8 properly', () => {
    expect(countTerminals(generateCustomMatrix(1, 1))).toBe(1);
    expect(countTerminals(generateCustomMatrix(2, 2))).toBe(4);
    expect(countTerminals(generateCustomMatrix(3, 2))).toBe(6);
    expect(countTerminals(generateCustomMatrix(5, 5))).toBe(25);
    expect(countTerminals(generateCustomMatrix(8, 8))).toBe(64);
  });
});
