import React, { useEffect, useRef } from 'react';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { RetroShaderRenderer } from '@/lib/retroShaderPipeline';

interface RetroCrtOverlayProps {
  className?: string;
}

export const RetroCrtOverlay: React.FC<RetroCrtOverlayProps> = ({ className = '' }) => {
  const retroShader = useCustomizationStore((s) => s.retroShader);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RetroShaderRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !retroShader.enabled) {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const renderer = new RetroShaderRenderer(canvas, retroShader);
    rendererRef.current = renderer;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.resize(width, height);
      }
    });

    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retroShader.enabled]);

  useEffect(() => {
    if (rendererRef.current && retroShader.enabled) {
      rendererRef.current.updateConfig(retroShader);
    }
  }, [retroShader]);

  if (!retroShader.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-10 h-full w-full mix-blend-screen opacity-90 ${className}`}
      aria-hidden="true"
    />
  );
};