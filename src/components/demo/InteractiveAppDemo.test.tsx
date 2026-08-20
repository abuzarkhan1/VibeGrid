import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractiveAppDemo } from './InteractiveAppDemo';

describe('InteractiveAppDemo Workspace Shell', () => {
  it('renders macOS window frame with traffic lights and title', () => {
    render(<InteractiveAppDemo />);

    // Check Window Title
    expect(
      screen.getByText(/VibeGrid Desktop — GPU-Accelerated Multi-Agent Terminal/i)
    ).toBeInTheDocument();

    // Check Version & GPU tags
    expect(screen.getByText(/VIBEGRID v0.1.0/i)).toBeInTheDocument();
    expect(screen.getByText(/METAL \/ WEBGL2/i)).toBeInTheDocument();

    // Check traffic lights (Close, Minimize, Maximize buttons)
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
  });

  it('renders top workspace tabs and switches workspaces smoothly', () => {
    render(<InteractiveAppDemo />);

    // Verify initial workspaces exist
    expect(screen.getByText('Workspace: Multi-Agent Prod')).toBeInTheDocument();
    expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    expect(screen.getByText('Rust Kernel')).toBeInTheDocument();
    expect(screen.getByText('+ New Workspace')).toBeInTheDocument();

    // Switch to "Frontend Dev"
    const frontendTab = screen.getByText('Frontend Dev');
    fireEvent.click(frontendTab);

    // Verify Layout adjusts to 2-Pane Side-by-Side
    expect(screen.getByText('Layouts: 2-Pane Side-by-Side')).toBeInTheDocument();

    // Switch to "Rust Kernel"
    const rustTab = screen.getByText('Rust Kernel');
    fireEvent.click(rustTab);

    // Verify Layout adjusts to 3-Pane T-Top
    expect(screen.getByText('Layouts: 3-Pane T-Top')).toBeInTheDocument();
  });

  it('allows creating a new workspace via modal', () => {
    render(<InteractiveAppDemo />);

    // Click "+ New Workspace"
    const newWsBtn = screen.getByText('+ New Workspace');
    fireEvent.click(newWsBtn);

    // Verify Modal appears
    expect(screen.getByText('Create New Project Workspace')).toBeInTheDocument();

    // Type new workspace name
    const input = screen.getByPlaceholderText(/Workspace Name/i);
    fireEvent.change(input, { target: { value: 'Swarm-Fleet-Cluster' } });

    // Click "Create Workspace"
    const createBtn = screen.getByRole('button', { name: 'Create Workspace' });
    fireEvent.click(createBtn);

    // Verify new workspace tab is created and active
    expect(screen.getByText('Swarm-Fleet-Cluster')).toBeInTheDocument();
  });

  it('provides layout studio trigger and allows selecting different presets', () => {
    render(<InteractiveAppDemo />);

    // Click Layout Studio trigger
    const layoutTrigger = screen.getByText(/Layouts: 2x2 Quad/i);
    fireEvent.click(layoutTrigger);

    // Verify Dropdown opens with options
    expect(screen.getByText('Select Grid Architecture')).toBeInTheDocument();
    expect(screen.getByText('Hero 1+3')).toBeInTheDocument();
    expect(screen.getByText('3-Columns')).toBeInTheDocument();
    expect(screen.getByText('6-Matrix 2×3')).toBeInTheDocument();

    // Select Hero 1+3
    const heroOption = screen.getByText('Hero 1+3');
    fireEvent.click(heroOption);

    // Verify layout updated
    expect(screen.getByText('Layouts: Hero 1+3')).toBeInTheDocument();
  });

  it('provides Agent Fleet Launcher trigger and allows deploying agents', () => {
    render(<InteractiveAppDemo />);

    // Click "+ Launch Agent"
    const launchAgentBtn = screen.getByText('+ Launch Agent');
    fireEvent.click(launchAgentBtn);

    // Verify Agent Fleet Launcher Modal
    expect(screen.getByText('VibeGrid AI Agent Fleet Launcher')).toBeInTheDocument();
    expect(screen.getByText('Codex Fullstack Engineer')).toBeInTheDocument();
    expect(screen.getByText('Claude 3.7 System Architect')).toBeInTheDocument();
    expect(screen.getByText('Gemini 2.0 GPU Optimizer')).toBeInTheDocument();
    expect(screen.getByText('Tokio PTY Kernel Specialist')).toBeInTheDocument();
    expect(screen.getByText('Zero-Day Security Sentinel')).toBeInTheDocument();

    // Deploy Codex Engineer
    const deployButtons = screen.getAllByText('Deploy to Pane');
    fireEvent.click(deployButtons[0]);

    // Verify modal closed
    expect(screen.queryByText('VibeGrid AI Agent Fleet Launcher')).not.toBeInTheDocument();
  });

  it('provides theme switcher and updates theme dynamically', () => {
    render(<InteractiveAppDemo />);

    // Click Theme Switcher
    const themeBtn = screen.getByText(/Theme: VibeDark/i);
    fireEvent.click(themeBtn);

    // Verify Theme options
    expect(screen.getByText('Catppuccin Mocha')).toBeInTheDocument();
    expect(screen.getByText('Nordic Frost')).toBeInTheDocument();
    expect(screen.getByText('Tokyo Night')).toBeInTheDocument();

    // Switch to Catppuccin
    const catppuccinOption = screen.getByText('Catppuccin Mocha');
    fireEvent.click(catppuccinOption);

    // Verify Theme switched
    expect(screen.getByText('Theme: Catppuccin')).toBeInTheDocument();
  });

  it('provides interactive Diff Viewer toggle', () => {
    render(<InteractiveAppDemo />);

    // Toggle Diff Viewer
    const diffToggle = screen.getByText(/Git Diff \(2 modified\)/i);
    fireEvent.click(diffToggle);

    // Verify Diff Viewer Drawer opens
    expect(screen.getByText('src/session/supervisor.ts')).toBeInTheDocument();
    expect(screen.getByText(/MAX_PARALLEL_WORKERS = 16;/i)).toBeInTheDocument();
    expect(screen.getByText('Stage Changes')).toBeInTheDocument();

    // Toggle Diff Viewer off
    fireEvent.click(diffToggle);
    expect(screen.queryByText('src/session/supervisor.ts')).not.toBeInTheDocument();
  });

  it('provides Fuzzy Command Palette trigger and keyboard shortcuts', () => {
    render(<InteractiveAppDemo />);

    // Click "⌘K Search"
    const cmdPaletteBtn = screen.getByText('⌘K Search');
    fireEvent.click(cmdPaletteBtn);

    // Verify Command Palette opened
    expect(screen.getByPlaceholderText(/Type a command or search actions/i)).toBeInTheDocument();
    expect(screen.getByText('Open AI Agent Fleet Launcher…')).toBeInTheDocument();
    expect(screen.getByText('Toggle Content-Aware Diff Viewer')).toBeInTheDocument();
    expect(screen.getByText('Apply 2x2 Quad Matrix Layout')).toBeInTheDocument();
  });

  it('provides live Voice indicator and interactive voice state transitions', () => {
    render(<InteractiveAppDemo />);

    // Initially Voice is Idle
    const voiceBtn = screen.getByText('Voice: Idle');
    expect(voiceBtn).toBeInTheDocument();

    // Click Voice trigger
    fireEvent.click(voiceBtn);

    // Now in Listening state
    expect(screen.getByText(/Voice: Listening…/i)).toBeInTheDocument();
  });

  it('renders bottom status bar with WebGL 2.0 FPS, PTY Latency, and Memory telemetry', () => {
    render(<InteractiveAppDemo />);

    // Telemetry items in footer
    expect(screen.getByText(/WebGL 2\.0: .* FPS/i)).toBeInTheDocument();
    expect(screen.getByText(/PTY Latency: .*ms/i)).toBeInTheDocument();
    expect(screen.getByText(/IPC: Tokio Stdio/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Memory: .* MB/i)).toBeInTheDocument();
    expect(screen.getByText(/git:\(main\*\)/i)).toBeInTheDocument();
    expect(screen.getByText(/UTF-8 · LF/i)).toBeInTheDocument();
  });
});
