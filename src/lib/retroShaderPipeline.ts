import { RetroShaderConfig, RetroShaderPresetName } from '@/types/customization';

export const DEFAULT_RETRO_CONFIG: RetroShaderConfig = {
  enabled: false,
  curvature: 0.08,
  scanlineIntensity: 0.25,
  scanlineCount: 480,
  bloomIntensity: 0.35,
  chromaticOffset: 0.003,
  vignetteDarkness: 0.4,
};

export const RETRO_SHADER_PRESETS: Record<RetroShaderPresetName, RetroShaderConfig> = {
  default: {
    enabled: true,
    curvature: 0.08,
    scanlineIntensity: 0.25,
    scanlineCount: 480,
    bloomIntensity: 0.35,
    chromaticOffset: 0.003,
    vignetteDarkness: 0.4,
  },
  cyberpunk: {
    enabled: true,
    curvature: 0.12,
    scanlineIntensity: 0.45,
    scanlineCount: 520,
    bloomIntensity: 0.65,
    chromaticOffset: 0.007,
    vignetteDarkness: 0.55,
  },
  matrix: {
    enabled: true,
    curvature: 0.05,
    scanlineIntensity: 0.35,
    scanlineCount: 440,
    bloomIntensity: 0.8,
    chromaticOffset: 0.002,
    vignetteDarkness: 0.45,
  },
  arcade: {
    enabled: true,
    curvature: 0.18,
    scanlineIntensity: 0.55,
    scanlineCount: 360,
    bloomIntensity: 0.4,
    chromaticOffset: 0.009,
    vignetteDarkness: 0.7,
  },
  subtle: {
    enabled: true,
    curvature: 0.02,
    scanlineIntensity: 0.15,
    scanlineCount: 600,
    bloomIntensity: 0.15,
    chromaticOffset: 0.001,
    vignetteDarkness: 0.2,
  },
  off: {
    enabled: false,
    curvature: 0.0,
    scanlineIntensity: 0.0,
    scanlineCount: 480,
    bloomIntensity: 0.0,
    chromaticOffset: 0.0,
    vignetteDarkness: 0.0,
  },
};

export const CRT_VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const CRT_FRAGMENT_SHADER_SOURCE = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform float u_curvature;          // 0.0 to 0.3
uniform float u_scanlineIntensity;  // 0.0 to 1.0
uniform float u_scanlineCount;      // 300.0 to 800.0
uniform float u_chromaticOffset;    // 0.0 to 0.015
uniform float u_bloomIntensity;     // 0.0 to 1.0
uniform float u_vignetteDarkness;   // 0.0 to 1.0

vec2 curveUV(vec2 uv) {
    uv = (uv - 0.5) * 2.0;
    uv.x *= 1.0 + pow((abs(uv.y) * u_curvature), 2.0);
    uv.y *= 1.0 + pow((abs(uv.x) * u_curvature), 2.0);
    return (uv / 2.0) + 0.5;
}

void main() {
    vec2 uv = v_uv;
    if (u_curvature > 0.001) {
        uv = curveUV(uv);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.95);
            return;
        }
    }

    // Base subtle CRT phosphor glow
    vec3 color = vec3(0.02, 0.04, 0.03);

    // Chromatic aberration simulation
    if (u_chromaticOffset > 0.0001) {
        vec2 dir = uv - 0.5;
        vec2 offset = normalize(dir) * length(dir) * u_chromaticOffset;
        color.r += 0.04 * (1.0 - length(uv + offset - 0.5));
        color.b += 0.05 * (1.0 - length(uv - offset - 0.5));
        color.g += 0.03 * (1.0 - length(uv - 0.5));
    }

    // Phosphor bloom
    if (u_bloomIntensity > 0.0) {
        float centerDist = length(uv - 0.5);
        float bloom = (1.0 - smoothstep(0.0, 0.7, centerDist)) * u_bloomIntensity * 0.15;
        color += vec3(bloom * 0.4, bloom * 0.9, bloom * 0.6);
    }

    // Scanlines
    if (u_scanlineIntensity > 0.0) {
        float scanline = (sin(uv.y * u_scanlineCount * 3.14159 + u_time * 3.0) + 1.0) * 0.5;
        color *= (1.0 - u_scanlineIntensity * (1.0 - scanline));
    }

    // Vignette
    if (u_vignetteDarkness > 0.0) {
        float vignette = clamp(pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.25), 0.0, 1.0);
        color *= mix(1.0 - u_vignetteDarkness, 1.0, vignette);
    }

    // Transparent overlay alpha
    float alpha = clamp(u_scanlineIntensity * 0.35 + u_vignetteDarkness * 0.25 + (u_curvature > 0.001 ? 0.2 : 0.0), 0.0, 0.75);
    gl_FragColor = vec4(color, alpha);
}
`;

/**
 * WebGL Retro Shader Pipeline Controller
 */
export class RetroShaderRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animFrameId: number | null = null;
  private startTime: number = Date.now();
  private config: RetroShaderConfig;

  constructor(canvas: HTMLCanvasElement, initialConfig: RetroShaderConfig = DEFAULT_RETRO_CONFIG) {
    this.canvas = canvas;
    this.config = initialConfig;
    this.initGL();
  }

  private initGL() {
    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      console.warn('[VibeGrid] WebGL not supported for retro CRT overlay');
      return;
    }
    this.gl = gl;

    const vertShader = this.compileShader(gl.VERTEX_SHADER, CRT_VERTEX_SHADER_SOURCE);
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, CRT_FRAGMENT_SHADER_SOURCE);

    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[VibeGrid] Shader link error:', gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    // Full-screen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.animFrameId = requestAnimationFrame(this.render);
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[VibeGrid] Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public updateConfig(config: RetroShaderConfig) {
    this.config = config;
  }

  public resize(width: number, height: number) {
    if (!this.gl || !this.canvas) return;
    this.canvas.width = Math.max(1, width);
    this.canvas.height = Math.max(1, height);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private render = () => {
    const gl = this.gl;
    const program = this.program;
    if (!gl || !program || !this.config.enabled) {
      if (this.config.enabled) {
        this.animFrameId = requestAnimationFrame(this.render);
      }
      return;
    }

    const elapsed = (Date.now() - this.startTime) / 1000.0;

    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uCurv = gl.getUniformLocation(program, 'u_curvature');
    const uScanInt = gl.getUniformLocation(program, 'u_scanlineIntensity');
    const uScanCnt = gl.getUniformLocation(program, 'u_scanlineCount');
    const uChrom = gl.getUniformLocation(program, 'u_chromaticOffset');
    const uBloom = gl.getUniformLocation(program, 'u_bloomIntensity');
    const uVign = gl.getUniformLocation(program, 'u_vignetteDarkness');

    if (uTime) gl.uniform1f(uTime, elapsed);
    if (uCurv) gl.uniform1f(uCurv, this.config.curvature);
    if (uScanInt) gl.uniform1f(uScanInt, this.config.scanlineIntensity);
    if (uScanCnt) gl.uniform1f(uScanCnt, this.config.scanlineCount);
    if (uChrom) gl.uniform1f(uChrom, this.config.chromaticOffset);
    if (uBloom) gl.uniform1f(uBloom, this.config.bloomIntensity);
    if (uVign) gl.uniform1f(uVign, this.config.vignetteDarkness);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.animFrameId = requestAnimationFrame(this.render);
  };

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.gl = null;
    this.program = null;
  }
}
