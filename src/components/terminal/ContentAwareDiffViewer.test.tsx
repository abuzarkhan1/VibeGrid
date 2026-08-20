import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentAwareDiffViewer } from './ContentAwareDiffViewer';

vi.mock('@/lib/tauri', () => ({
  isTauri: () => false,
  getGitDiff: vi.fn().mockResolvedValue({
    is_git_repo: true,
    branch: 'feature/diff-engine',
    files: [
      { path: 'src/lib/agentRegistry.ts', status: 'modified', staged: false },
      { path: 'src/components/agent/AgentLogos.tsx', status: 'added', staged: true },
    ],
    active_file: 'src/lib/agentRegistry.ts',
    diff_lines: [
      { line_type: 'context', line_old: 1, line_new: 1, text: 'import { DiscoveredAgent } from "@/types/agent";' },
      { line_type: 'remove', line_old: 2, line_new: null, text: '- name: "Claude Code",' },
      { line_type: 'add', line_old: null, line_new: 2, text: '+ name: "Claude",' },
    ],
    stats: { additions: 1, deletions: 1 },
    error: null,
  }),
}));

describe('ContentAwareDiffViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders branch name, active file, and diff statistics', async () => {
    render(<ContentAwareDiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('feature/diff-engine')).toBeTruthy();
      expect(screen.getByText('src/lib/agentRegistry.ts')).toBeTruthy();
      expect(screen.getByText('+1')).toBeTruthy();
      expect(screen.getByText('-1')).toBeTruthy();
    });
  });

  it('displays added and removed lines correctly', async () => {
    render(<ContentAwareDiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('name: "Claude",')).toBeTruthy();
      expect(screen.getByText('name: "Claude Code",')).toBeTruthy();
    });
  });

  it('allows opening changed files dropdown and selecting a file', async () => {
    render(<ContentAwareDiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('src/lib/agentRegistry.ts')).toBeTruthy();
    });

    const fileDropdownBtn = screen.getByRole('button', { name: /src\/lib\/agentRegistry\.ts/i });
    fireEvent.click(fileDropdownBtn);

    await waitFor(() => {
      expect(screen.getByText(/Changed Files \(2\)/i)).toBeTruthy();
      expect(screen.getByText('src/components/agent/AgentLogos.tsx')).toBeTruthy();
    });
  });
});
