import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomizationStore } from './useCustomizationStore';
import { RETRO_SHADER_PRESETS } from '@/lib/retroShaderPipeline';

describe('useCustomizationStore', () => {
  beforeEach(() => {
    useCustomizationStore.setState({
      isOpen: false,
      activeSection: 'identity',
      workspaceName: 'Test Lab',
      colorRingHex: '#3c95f0',
      defaultCwd: '/test/cwd',
      envVars: {},
      themeName: 'tokyoNight',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      fontLigatures: true,
      lineHeight: 1.2,
      terminalOpacity: 0.95,
      cursorStyle: 'bar',
      cursorBlink: true,
    });
  });

  it('manages modal open state and active section transitions', () => {
    const store = useCustomizationStore.getState();
    store.openCustomizer('appearance');
    expect(useCustomizationStore.getState().isOpen).toBe(true);
    expect(useCustomizationStore.getState().activeSection).toBe('appearance');

    store.setActiveSection('terminal');
    expect(useCustomizationStore.getState().activeSection).toBe('terminal');

    store.closeCustomizer();
    expect(useCustomizationStore.getState().isOpen).toBe(false);
  });

  it('updates workspace identity properties', () => {
    const store = useCustomizationStore.getState();
    store.setWorkspaceName('AI Reasoning Grid');
    store.setColorRingHex('#10b981');
    store.setWorkspaceIcon({ type: 'emoji', value: '🤖' });

    const state = useCustomizationStore.getState();
    expect(state.workspaceName).toBe('AI Reasoning Grid');
    expect(state.colorRingHex).toBe('#10b981');
    expect(state.workspaceIcon.value).toBe('🤖');
  });

  it('applies retro shader presets and custom configurations', () => {
    const store = useCustomizationStore.getState();
    store.applyShaderPreset('cyberpunk');

    const state = useCustomizationStore.getState();
    expect(state.retroShader.enabled).toBe(true);
    expect(state.retroShader.curvature).toBe(RETRO_SHADER_PRESETS.cyberpunk.curvature);
    expect(state.retroShader.bloomIntensity).toBe(RETRO_SHADER_PRESETS.cyberpunk.bloomIntensity);

    store.setRetroShader({ scanlineIntensity: 0.8 });
    expect(useCustomizationStore.getState().retroShader.scanlineIntensity).toBe(0.8);
  });

  it('validates and bounds draft typography and appearance', () => {
    const store = useCustomizationStore.getState();
    store.setDraftFontSize(40); // clamp max to 32
    expect(useCustomizationStore.getState().fontSize).toBe(32);

    store.setDraftFontSize(4); // clamp min to 8
    expect(useCustomizationStore.getState().fontSize).toBe(8);

    store.setDraftOpacity(1.5); // clamp max to 1.0
    expect(useCustomizationStore.getState().terminalOpacity).toBe(1.0);

    store.setDraftCursorStyle('block');
    expect(useCustomizationStore.getState().cursorStyle).toBe('block');
  });
});
