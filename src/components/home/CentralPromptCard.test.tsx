import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CentralPromptCard } from './CentralPromptCard';
import { useUIStore } from '@/store/useUIStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useAgentStore } from '@/store/useAgentStore';

describe('CentralPromptCard - 3-Step AI Agent & Terminal Matrix Deployment Flow', () => {
  beforeEach(() => {
    useUIStore.setState({ activeViewMode: 'hub' });
    usePaneStore.setState({ presetCount: 1 });
    useAgentStore.setState({ paneAssignments: {} });
  });

  it('renders Step 1: Select AI Agent Harness with popular harnesses', () => {
    render(<CentralPromptCard />);

    expect(screen.getByText('Select AI Agent Harness')).toBeTruthy();
    expect(screen.getByText('Step 1 of 3 · Select Harness')).toBeTruthy();
    expect(screen.getByText('Claude')).toBeTruthy();
    expect(screen.getByText('Codex')).toBeTruthy();
    expect(screen.getByText('Antigravity')).toBeTruthy();
    expect(screen.getByText('Terminal')).toBeTruthy();
  });

  it('transitions to Step 2: Select Terminal Matrix when an agent is selected', () => {
    render(<CentralPromptCard />);

    // Click on Claude agent
    const claudeCard = screen.getByText('Claude').closest('button');
    expect(claudeCard).toBeTruthy();
    fireEvent.click(claudeCard!);

    // Should now be on Step 2
    expect(screen.getByText('Step 2 of 3 · Select Matrix')).toBeTruthy();
    expect(screen.getByText('Select Terminal Matrix')).toBeTruthy();
    expect(screen.getByText('Change Agent')).toBeTruthy();
    expect(screen.getByText('Solo')).toBeTruthy();
    expect(screen.getByText('Dual')).toBeTruthy();
    expect(screen.getByText('Quad')).toBeTruthy();
    expect(screen.getByText('Hex')).toBeTruthy();
    expect(screen.getByText('Hive')).toBeTruthy();
    expect(screen.getByText('Matrix')).toBeTruthy();
  });

  it('allows going back from Step 2 to Step 1 via Change Agent button', () => {
    render(<CentralPromptCard />);

    // Go to Step 2
    fireEvent.click(screen.getByText('Codex').closest('button')!);
    expect(screen.getByText('Step 2 of 3 · Select Matrix')).toBeTruthy();

    // Click Change Agent
    fireEvent.click(screen.getByText('Change Agent').closest('button')!);

    // Should be back on Step 1
    expect(screen.getByText('Step 1 of 3 · Select Harness')).toBeTruthy();
    expect(screen.getByText('Select AI Agent Harness')).toBeTruthy();
  });

  it('transitions to Step 3: Fleet Provisioning Preview and lists exact pane instances', () => {
    render(<CentralPromptCard />);

    // Step 1: Click Claude
    fireEvent.click(screen.getByText('Claude').closest('button')!);

    // Step 2: Click Dual (2 Panes)
    fireEvent.click(screen.getByText('Dual').closest('button')!);

    // Should now be on Step 3
    expect(screen.getByText('Step 3 of 3 · Fleet Provisioning')).toBeTruthy();
    expect(screen.getByText('Fleet Provisioning Preview')).toBeTruthy();
    expect(screen.getByText(/The following 2 parallel Claude instances will be initialized and launched/i)).toBeTruthy();

    // Check that 2 Claude instances are listed with Ready badges
    const readyBadges = screen.getAllByText('Ready');
    expect(readyBadges.length).toBe(2);

    // Check deploy buttons
    expect(screen.getByRole('button', { name: /Deploy 2× Claude Fleet/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Launch as Blank Shells/i })).toBeTruthy();
  });

  it('deploys the fleet and switches active view mode to grid', () => {
    render(<CentralPromptCard />);

    // Step 1: Select Antigravity
    fireEvent.click(screen.getByText('Antigravity').closest('button')!);

    // Step 2: Select Quad (4 Panes)
    fireEvent.click(screen.getByText('Quad').closest('button')!);

    // Step 3: Click Deploy 4x Antigravity Fleet
    const deployBtn = screen.getByRole('button', { name: /Deploy 4× Antigravity Fleet/i });
    fireEvent.click(deployBtn);

    // View mode should switch to grid
    expect(useUIStore.getState().activeViewMode).toBe('grid');
  });
});
