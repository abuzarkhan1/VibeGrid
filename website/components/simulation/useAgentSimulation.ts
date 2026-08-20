'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AgentPaneId,
  SimulationState,
  SimulationLogLine,
  CommandExecutionResult,
} from './simulation-types';
import {
  PANE_CONFIGS,
  INITIAL_LOGS,
  STREAMING_SCRIPT,
  SYMPHONY_SEQUENCE,
  COMMAND_RESPONSES,
} from './simulation-data';

const MAX_LOGS_PER_PANE = 30; // Bounded circular buffer prevents memory leaks
const BASE_TICK_INTERVAL_MS = 1000;

export function useAgentSimulation() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [activePaneId, setActivePaneId] = useState<AgentPaneId>('claude');
  const [viewMode, setViewMode] = useState<'grid' | 'focused' | 'diff'>('grid');
  const [symphonyActive, setSymphonyActive] = useState<boolean>(false);
  const [symphonyProgress, setSymphonyProgress] = useState<number>(0);
  const [totalTicks, setTotalTicks] = useState<number>(0);

  const [logs, setLogs] = useState<Record<AgentPaneId, SimulationLogLine[]>>(() => ({
    claude: [...INITIAL_LOGS.claude],
    cargo: [...INITIAL_LOGS.cargo],
    nextjs: [...INITIAL_LOGS.nextjs],
    ollama: [...INITIAL_LOGS.ollama],
  }));

  const [currentStatuses, setCurrentStatuses] = useState<Record<AgentPaneId, string>>({
    claude: PANE_CONFIGS.claude.initialStatus,
    cargo: PANE_CONFIGS.cargo.initialStatus,
    nextjs: PANE_CONFIGS.nextjs.initialStatus,
    ollama: PANE_CONFIGS.ollama.initialStatus,
  });

  const [isStreaming, setIsStreaming] = useState<Record<AgentPaneId, boolean>>({
    claude: true,
    cargo: true,
    nextjs: true,
    ollama: true,
  });

  const [totalTokensGenerated, setTotalTokensGenerated] = useState<number>(1420);
  const [ptyLatency, setPtyLatency] = useState<number>(1.2);
  const [fps, setFps] = useState<number>(60.0);

  // Script indices for each pane
  const scriptIndicesRef = useRef<Record<AgentPaneId, number>>({
    claude: 0,
    cargo: 0,
    nextjs: 0,
    ollama: 0,
  });

  // Unique ID counter
  const logCounterRef = useRef<number>(100);

  // Symphony animation timer ref
  const symphonyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format current timestamp helper
  const getTimestamp = useCallback(() => {
    const d = new Date();
    const pad = (n: number, s = 2) => String(n).padStart(s, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  }, []);

  // Append log line to a specific pane with circular buffer constraint
  const appendLogLine = useCallback(
    (paneId: AgentPaneId, line: Omit<SimulationLogLine, 'id' | 'timestamp'>) => {
      logCounterRef.current += 1;
      const newLine: SimulationLogLine = {
        id: `${paneId}-${logCounterRef.current}`,
        timestamp: getTimestamp(),
        ...line,
      };

      setLogs((prev) => {
        const paneLogs = prev[paneId] || [];
        const updated = [...paneLogs, newLine];
        // Enforce circular buffer cap
        if (updated.length > MAX_LOGS_PER_PANE) {
          return {
            ...prev,
            [paneId]: updated.slice(updated.length - MAX_LOGS_PER_PANE),
          };
        }
        return {
          ...prev,
          [paneId]: updated,
        };
      });
    },
    [getTimestamp]
  );

  // Advance simulation tick across panes
  const handleSimulationTick = useCallback(() => {
    const paneIds: AgentPaneId[] = ['claude', 'cargo', 'nextjs', 'ollama'];
    
    // Pick which pane updates this tick (or rotate round-robin)
    paneIds.forEach((pId, idx) => {
      // Slightly stagger updates for realistic async multi-agent feel
      const scriptList = STREAMING_SCRIPT[pId];
      const currentIndex = scriptIndicesRef.current[pId];
      const step = scriptList[currentIndex % scriptList.length];

      scriptIndicesRef.current[pId] = (currentIndex + 1) % scriptList.length;

      appendLogLine(pId, {
        bullet: step.bullet,
        bulletColor: step.bulletColor,
        text: step.text,
        type: step.type,
      });

      setCurrentStatuses((prev) => ({
        ...prev,
        [pId]: step.status,
      }));
    });

    // Update telemetry metrics with smooth micro-fluctuations
    setTotalTicks((t) => t + 1);
    setTotalTokensGenerated((prev) => prev + Math.floor(Math.random() * 42 + 28));
    setPtyLatency(parseFloat((0.9 + Math.random() * 0.4).toFixed(2)));
    setFps(parseFloat((59.8 + Math.random() * 0.4).toFixed(1)));
  }, [appendLogLine]);

  // Main simulation tick effect with speed control
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(150, Math.floor(BASE_TICK_INTERVAL_MS / speed));
    const interval = setInterval(handleSimulationTick, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, handleSimulationTick]);

  // Trigger Multi-Agent Symphony Action
  const triggerSymphony = useCallback(() => {
    if (symphonyActive) return;

    setSymphonyActive(true);
    setSymphonyProgress(0);

    // Broadcast Symphony sequence across all 4 panes
    const paneIds: AgentPaneId[] = ['claude', 'cargo', 'nextjs', 'ollama'];
    paneIds.forEach((pId) => {
      const symSteps = SYMPHONY_SEQUENCE[pId];
      symSteps.forEach((step, sIdx) => {
        setTimeout(() => {
          appendLogLine(pId, {
            bullet: step.bullet,
            bulletColor: step.bulletColor,
            text: step.text,
            type: step.type,
          });
          setCurrentStatuses((prev) => ({
            ...prev,
            [pId]: step.status,
          }));
        }, sIdx * 400);
      });
    });

    // Animate Symphony HUD progress bar
    let progress = 0;
    if (symphonyIntervalRef.current) clearInterval(symphonyIntervalRef.current);

    symphonyIntervalRef.current = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        setSymphonyProgress(100);
        if (symphonyIntervalRef.current) clearInterval(symphonyIntervalRef.current);
        setTimeout(() => {
          setSymphonyActive(false);
          setSymphonyProgress(0);
        }, 1200);
      } else {
        setSymphonyProgress(progress);
      }
    }, 100);
  }, [symphonyActive, appendLogLine]);

  // Clean up symphony timer on unmount
  useEffect(() => {
    return () => {
      if (symphonyIntervalRef.current) clearInterval(symphonyIntervalRef.current);
    };
  }, []);

  // Real-time Command Executor
  const executeCommand = useCallback(
    (inputStr: string) => {
      const trimmed = inputStr.trim();
      if (!trimmed) return;

      const lower = trimmed.toLowerCase();

      // Check for special built-in actions
      if (lower === 'clear') {
        setLogs((prev) => ({
          ...prev,
          [activePaneId]: [],
        }));
        return;
      }

      if (lower === 'symphony') {
        triggerSymphony();
        return;
      }

      // Check matched predefined command or fuzzy match
      const matchedKey = Object.keys(COMMAND_RESPONSES).find(
        (key) => lower.includes(key) || key.includes(lower)
      );

      const targetPane = matchedKey ? COMMAND_RESPONSES[matchedKey].targetPane : activePaneId;

      // 1. Log the user command entry in terminal style
      appendLogLine(targetPane, {
        bullet: '$',
        bulletColor: 'text-white',
        text: trimmed,
        type: 'cmd',
      });

      if (matchedKey) {
        const res = COMMAND_RESPONSES[matchedKey];
        // Append response lines with micro-delays for realistic execution feel
        res.outputLines.forEach((outLine, idx) => {
          setTimeout(() => {
            appendLogLine(targetPane, {
              bullet: outLine.bullet,
              bulletColor: outLine.bulletColor,
              text: outLine.text,
              type: outLine.type,
            });
          }, (idx + 1) * 80);
        });

        if (res.statusUpdate) {
          setCurrentStatuses((prev) => ({
            ...prev,
            [targetPane]: res.statusUpdate || prev[targetPane],
          }));
        }
      } else {
        // Dynamic simulated output for arbitrary user custom command
        setTimeout(() => {
          appendLogLine(targetPane, {
            bullet: '⚡',
            bulletColor: 'text-[#5683da]',
            text: `[VibeGrid CLI] Executed custom instruction: "${trimmed}"`,
            type: 'accent',
          });
        }, 80);
        setTimeout(() => {
          appendLogLine(targetPane, {
            bullet: '✔',
            bulletColor: 'text-[#27c93f]',
            text: `Subprocess exited with status 0 (0.14ms latency · 0 egress)`,
            type: 'success',
          });
        }, 160);
      }
    },
    [activePaneId, appendLogLine, triggerSymphony]
  );

  // Reset simulation state
  const resetSimulation = useCallback(() => {
    setLogs({
      claude: [...INITIAL_LOGS.claude],
      cargo: [...INITIAL_LOGS.cargo],
      nextjs: [...INITIAL_LOGS.nextjs],
      ollama: [...INITIAL_LOGS.ollama],
    });
    setCurrentStatuses({
      claude: PANE_CONFIGS.claude.initialStatus,
      cargo: PANE_CONFIGS.cargo.initialStatus,
      nextjs: PANE_CONFIGS.nextjs.initialStatus,
      ollama: PANE_CONFIGS.ollama.initialStatus,
    });
    setTotalTicks(0);
    setTotalTokensGenerated(1420);
    scriptIndicesRef.current = { claude: 0, cargo: 0, nextjs: 0, ollama: 0 };
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    activePaneId,
    setActivePaneId,
    viewMode,
    setViewMode,
    symphonyActive,
    symphonyProgress,
    totalTicks,
    logs,
    currentStatuses,
    isStreaming,
    totalTokensGenerated,
    ptyLatency,
    fps,
    triggerSymphony,
    executeCommand,
    resetSimulation,
  };
}
