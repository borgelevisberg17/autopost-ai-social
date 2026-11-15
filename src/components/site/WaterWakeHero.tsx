import React, { useEffect, useRef } from "react";

interface WaterWakeHeroProps {
  children?: React.ReactNode;
  damping?: number;
  dropRadius?: number;
  className?: string;
  /**
   * "hero": Renderiza o palco fluido completo com malha Aurora refratada, grelha arquitetónica,
   *         cáusticas intensas, dispersão cromática RGB e esteira Kelvin.
   * "global": Camada WebGL fixa no viewport inteiro que acompanha o utilizador durante todo o scroll,
   *           reagindo ao cursor, cliques e velocidade de scroll em todas as secções da página.
   */
  variant?: "hero" | "global";
}

const VERTEX_SHADER = `
  attribute vec2 a_pos;
  varying vec2 v_uv;

  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D u_water;
  uniform vec2 u_waterTexel;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_scrollOffset;
  uniform float u_scrollVelocity;
  uniform vec2 u_pointer;
  uniform float u_pointerActive;
  uniform float u_isGlobal;
  varying vec2 v_uv;

  float readHeight(vec2 uv) {
    float encoded = texture2D(u_water, clamp(uv, 0.001, 0.999)).r;
    return (encoded - 0.5019608) * 1.15;
  }

  float readMist(vec2 uv) {
    return texture2D(u_water, clamp(uv, 0.001, 0.999)).g;
  }

  float causticPattern(vec2 uv, float t) {
    vec2 p = uv * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0) * 6.5;
    float c1 = sin(p.x * 2.4 + t * 1.3 + cos(p.y * 2.1 - t * 0.9));
    float c2 = cos(p.y * 2.8 - t * 1.1 + sin(p.x * 1.9 + t * 1.4));
    return pow(clamp((c1 * c2) * 0.5 + 0.5, 0.0, 1.0), 3.0);
  }

  // Campo Aurora + Grelha Arquitetónica Lusion que sofre refração física pela água
  vec3 sampleAuroraBackdrop(vec2 uv, float t) {
    vec2 aspectUV = vec2(uv.x * (u_resolution.x / max(u_resolution.y, 1.0)), uv.y);

    // Ondas orgânicas contínuas de luz (Esmeralda, Teal, Índigo e Ciano)
    vec2 orb1 = vec2(0.28 + sin(t * 0.42) * 0.16, 0.68 + cos(t * 0.35) * 0.12);
    vec2 orb2 = vec2(0.74 + cos(t * 0.38) * 0.15, 0.56 + sin(t * 0.48) * 0.14);
    vec2 orb3 = vec2(0.50 + sin(t * 0.55 + 1.4) * 0.22, 0.32 + cos(t * 0.41) * 0.12);

    float d1 = exp(-length(uv - orb1) * 3.2);
    float d2 = exp(-length(uv - orb2) * 3.4);
    float d3 = exp(-length(uv - orb3) * 3.6);

    vec3 baseBg = vec3(0.985, 0.992, 0.990);
    vec3 emeraldGlow = vec3(0.06, 0.78, 0.56);
    vec3 cyanGlow = vec3(0.05, 0.72, 0.84);
    vec3 indigoGlow = vec3(0.38, 0.36, 0.94);

    vec3 aurora = baseBg;
    aurora = mix(aurora, mix(baseBg, emeraldGlow, 0.24), d1);
    aurora = mix(aurora, mix(baseBg, cyanGlow, 0.22), d2);
    aurora = mix(aurora, mix(baseBg, indigoGlow, 0.18), d3);

    // Fita senoidal fluida estilo Lusion atravessando o campo
    float ribbonWave = sin(uv.x * 5.2 + t * 0.75 + sin(uv.y * 3.4 - t * 0.5)) * 0.14 + 0.52;
    float ribbonMask = exp(-abs(uv.y - ribbonWave) * 14.0);
    aurora = mix(aurora, vec3(0.08, 0.82, 0.65), ribbonMask * 0.22);

    // Grelha arquitetónica de precisão que dobra e refrata com as ondas da água
    vec2 gridUV = fract(aspectUV * 14.0 + vec2(0.0, u_scrollOffset * 0.35));
    float gridLineX = 1.0 - smoothstep(0.0, 0.032, min(gridUV.x, 1.0 - gridUV.x));
    float gridLineY = 1.0 - smoothstep(0.0, 0.032, min(gridUV.y, 1.0 - gridUV.y));
    float grid = max(gridLineX, gridLineY);
    aurora = mix(aurora, vec3(0.06, 0.48, 0.40), grid * 0.085);

    return aurora;
  }

  void main() {
    float height = readHeight(v_uv);
    float hL = readHeight(v_uv - vec2(u_waterTexel.x, 0.0));
    float hR = readHeight(v_uv + vec2(u_waterTexel.x, 0.0));
    float hD = readHeight(v_uv - vec2(0.0, u_waterTexel.y));
    float hU = readHeight(v_uv + vec2(0.0, u_waterTexel.y));

    // Ondas harmónicas autónomas contínuas para nunca ficar parado/minimalista
    float autoWaveX = cos(v_uv.x * 16.0 + u_time * 1.45 + v_uv.y * 6.0) * 0.018;
    float autoWaveY = sin(v_uv.y * 14.0 - u_time * 1.2 + v_uv.x * 5.0) * 0.018;

    vec2 rawSlope = vec2(
      (hR - hL) / max(2.0 * u_waterTexel.x, 0.0001),
      (hU - hD) / max(2.0 * u_waterTexel.y, 0.0001)
    );
    vec2 slope = rawSlope + vec2(autoWaveX, autoWaveY) * (1.0 - u_isGlobal * 0.55);

    float mist = readMist(v_uv);
    float slopeStrength = length(slope);
    float rawStrength = length(rawSlope);
    vec3 normal = normalize(vec3(-slope * 0.24, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    // Dispersão cromática RGB (Prisma Lusion) proporcional à curvatura da onda
    float dispersion = 0.048 * smoothstep(0.006, 0.36, slopeStrength) + abs(u_scrollVelocity) * 0.012;
    vec2 refractOffset = normal.xy * (0.085 + dispersion);

    float dispR = readHeight(v_uv + slope * dispersion * 2.2);
    float dispB = readHeight(v_uv - slope * dispersion * 2.2);

    float laplacian = (hR + hL + hU + hD - 4.0 * height);
    float dynamicCaustics = clamp(-laplacian * 58.0, 0.0, 1.0) * smoothstep(0.008, 0.26, slopeStrength);
    float ambientCaustics = causticPattern(v_uv + normal.xy * 0.06, u_time) * smoothstep(0.004, 0.22, slopeStrength);
    float caustics = clamp(dynamicCaustics + ambientCaustics * 0.48, 0.0, 1.0);

    // Iluminação 3D dupla (Key Light + Rim Light Iridescente + Fresnel)
    vec3 keyLight = normalize(vec3(-0.38, 0.56, 0.74));
    vec3 rimLight = normalize(vec3(0.48, -0.42, 0.77));
    vec3 halfKey = normalize(keyLight + viewDir);
    vec3 halfRim = normalize(rimLight + viewDir);

    float waterEdge = smoothstep(0.008, 0.28, slopeStrength);
    float specKey = pow(max(dot(normal, halfKey), 0.0), 28.0) * waterEdge;
    float specRim = pow(max(dot(normal, halfRim), 0.0), 14.0) * waterEdge;
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);

    float crest = smoothstep(0.001, 0.020, max(height, 0.0));
    float trough = smoothstep(0.001, 0.024, max(-height, 0.0));
    float softBody = smoothstep(0.006, 0.12, mist);

    // Halo reativo em torno do ponteiro
    float pointerDist = length((v_uv - u_pointer) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0));
    float pointerHalo = exp(-pointerDist * 5.5) * u_pointerActive;

    // Paleta Lusion x Vendora (Esmeralda líquida, Ciano bioluminescente, Violeta prismático)
    vec3 baseWater = vec3(0.05, 0.68, 0.58);
    vec3 deepTrough = vec3(0.02, 0.22, 0.38);
    vec3 crestColor = vec3(0.42, 0.96, 0.88);
    vec3 prismViolet = vec3(0.46, 0.34, 0.96);
    vec3 specularColor = vec3(0.98, 1.0, 1.0);

    // Refração cromática RGB do pano de fundo Aurora
    vec3 auroraR = sampleAuroraBackdrop(v_uv + refractOffset * 1.35, u_time);
    vec3 auroraG = sampleAuroraBackdrop(v_uv + refractOffset * 1.00, u_time);
    vec3 auroraB = sampleAuroraBackdrop(v_uv + refractOffset * 0.65, u_time);
    vec3 refractedBackdrop = vec3(auroraR.r, auroraG.g, auroraB.b);

    vec3 waveColor = baseWater;
    waveColor = mix(waveColor, deepTrough, trough * 0.85);
    waveColor = mix(waveColor, crestColor, crest * 0.88);

    // Separação prismática nas cristas da esteira Kelvin
    waveColor.r += smoothstep(0.0015, 0.024, max(dispR, 0.0)) * 0.42;
    waveColor.b += smoothstep(0.0015, 0.024, max(-dispB, 0.0)) * 0.52;
    waveColor = mix(waveColor, prismViolet, smoothstep(0.08, 0.38, slopeStrength) * 0.45);
    waveColor += pow(caustics, 1.45) * vec3(0.45, 0.98, 0.88) * 0.95;
    waveColor = mix(waveColor, specularColor, clamp(specKey * 2.6 + specRim * 1.45, 0.0, 0.98));

    float waveEnergy = clamp(
      softBody * 0.38 +
      trough * 0.52 +
      crest * 0.58 +
      caustics * 0.48 +
      (specKey + specRim) * 0.72 +
      fresnel * 0.38 +
      pointerHalo * 0.22,
      0.0,
      0.92
    );

    if (u_isGlobal > 0.5) {
      // Modo Global (acompanha todo o scroll da página com ondas líquidas visíveis e elegantes)
      float globalAlpha = clamp(
        rawStrength * 1.65 + softBody * 0.34 + caustics * 0.38 + (specKey + specRim) * 0.65 + pointerHalo * 0.14,
        0.0,
        0.58
      );
      gl_FragColor = vec4(waveColor * globalAlpha, globalAlpha);
    } else {
      // Modo Hero: fundo Aurora + Grelha refratada sempre viva + ondas volumétricas intensas
      vec3 composed = mix(refractedBackdrop, waveColor, waveEnergy * 0.76);
      composed += vec3(0.08, 0.85, 0.72) * pointerHalo * 0.14;
      composed = mix(composed, specularColor, clamp(specKey * 1.8, 0.0, 0.85));
      float heroAlpha = clamp(0.42 + waveEnergy * 0.52, 0.0, 0.94);
      gl_FragColor = vec4(composed * heroAlpha, heroAlpha);
    }
  }
`;

export const WaterWakeHero: React.FC<WaterWakeHeroProps> = ({
  children,
  damping = 0.993,
  dropRadius = 0.032,
  className = "",
  variant = "hero",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    let disposed = false;
    const simWidth = 192;
    let simHeight = 144;

    let previous = new Float32Array(simWidth * simHeight);
    let current = new Float32Array(simWidth * simHeight);
    let next = new Float32Array(simWidth * simHeight);
    let mistCurrent = new Float32Array(simWidth * simHeight);
    let mistNext = new Float32Array(simWidth * simHeight);
    let encodedField = new Uint8Array(simWidth * simHeight * 4);

    let lastPointer: { x: number; y: number } | null = null;
    let pointerPos = { x: 0.5, y: 0.5 };
    let pointerActive = 0;
    let scrollVelocity = 0;
    let animationFrame = 0;
    let lastFrameTime = 0;
    const startTime = performance.now();

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    let reducedMotion = reducedMotionQuery.matches;
    const dampingFactor = Math.max(0.95, Math.min(0.999, damping));
    const encodeScale = 360;

    const compileShader = (
      type: number,
      source: string
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(
          "WaterWakeHero shader compilation failed:",
          gl.getShaderInfoLog(shader)
        );
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.bindAttribLocation(program, 0, "a_pos");
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(
        "WaterWakeHero program link failed:",
        gl.getProgramInfoLog(program)
      );
      gl.deleteProgram(program);
      return;
    }

    const quadBuffer = gl.createBuffer();
    const waterTexture = gl.createTexture();
    if (!quadBuffer || !waterTexture) {
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (waterTexture) gl.deleteTexture(waterTexture);
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uniforms = {
      water: gl.getUniformLocation(program, "u_water"),
      waterTexel: gl.getUniformLocation(program, "u_waterTexel"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      scrollOffset: gl.getUniformLocation(program, "u_scrollOffset"),
      scrollVelocity: gl.getUniformLocation(program, "u_scrollVelocity"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      pointerActive: gl.getUniformLocation(program, "u_pointerActive"),
      isGlobal: gl.getUniformLocation(program, "u_isGlobal"),
    };

    const uploadWaterField = () => {
      const pixelCount = simWidth * simHeight;
      for (let i = 0; i < pixelCount; i += 1) {
        const value = Math.max(-0.28, Math.min(0.28, current[i]));
        const offset = i * 4;
        encodedField[offset] = Math.max(
          0,
          Math.min(255, Math.round(128 + value * encodeScale))
        );
        encodedField[offset + 1] = Math.max(
          0,
          Math.min(255, Math.round(mistCurrent[i] * 255))
        );
        encodedField[offset + 2] = 0;
        encodedField[offset + 3] = 255;
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, waterTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        simWidth,
        simHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        encodedField
      );
    };

    const draw = (nowMs: number) => {
      if (disposed || canvas.width === 0 || canvas.height === 0) return;
      const elapsedSec = (nowMs - startTime) * 0.001;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, waterTexture);
      gl.uniform1i(uniforms.water, 1);
      gl.uniform2f(uniforms.waterTexel, 1 / simWidth, 1 / simHeight);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, elapsedSec);
      gl.uniform1f(
        uniforms.scrollOffset,
        window.scrollY / Math.max(window.innerHeight, 1)
      );
      gl.uniform1f(uniforms.scrollVelocity, scrollVelocity);
      gl.uniform2f(uniforms.pointer, pointerPos.x, pointerPos.y);
      gl.uniform1f(uniforms.pointerActive, pointerActive);
      gl.uniform1f(uniforms.isGlobal, variant === "global" ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const injectWake = (
      x: number,
      y: number,
      directionX: number,
      directionY: number,
      strength: number
    ) => {
      const centerX = x * (simWidth - 1);
      const centerY = y * (simHeight - 1);
      const wakeLength = Math.max(9, Math.min(simWidth, simHeight) * 0.075);
      const maxSpread = 1.8 + wakeLength * 0.28;
      const extent = wakeLength + maxSpread;
      const coreRadius = Math.max(
        1.1,
        dropRadius * Math.min(simWidth, simHeight) * 0.56
      );

      const startX = Math.max(1, Math.floor(centerX - extent));
      const endX = Math.min(simWidth - 2, Math.ceil(centerX + extent));
      const startY = Math.max(1, Math.floor(centerY - extent));
      const endY = Math.min(simHeight - 2, Math.ceil(centerY + extent));

      for (let py = startY; py <= endY; py += 1) {
        for (let px = startX; px <= endX; px += 1) {
          const dx = px - centerX;
          const dy = py - centerY;
          const along = dx * directionX + dy * directionY;
          const across = -dx * directionY + dy * directionX;
          const behind = -along;
          const index = py * simWidth + px;

          const center = Math.exp(
            -(
              (along * along) / (coreRadius * coreRadius * 2.2) +
              (across * across) / (coreRadius * coreRadius * 0.85)
            )
          );

          let wings = 0;
          if (behind > 0 && behind < wakeLength) {
            const spread = 0.65 + behind * 0.16;
            const wingWidth = 0.45 + behind * 0.016;
            const wingDistance = Math.abs(across) - spread;
            const widthFalloff = Math.exp(
              -(wingDistance * wingDistance) / (wingWidth * wingWidth * 2.1)
            );
            const lengthFalloff = Math.exp(-behind / (wakeLength * 0.85));
            wings = widthFalloff * lengthFalloff;
          }

          current[index] = Math.max(
            -0.28,
            Math.min(
              0.28,
              current[index] + strength * (wings * 1.15 - center * 1.35)
            )
          );
          mistCurrent[index] = Math.min(
            0.65,
            mistCurrent[index] +
              strength * 1.65 * (wings * 0.85 + center * 0.38)
          );
        }
      }
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const newSimHeight = Math.max(
        108,
        Math.min(256, Math.round(simWidth * (rect.height / rect.width)))
      );
      if (newSimHeight !== simHeight) {
        simHeight = newSimHeight;
        previous = new Float32Array(simWidth * simHeight);
        current = new Float32Array(simWidth * simHeight);
        next = new Float32Array(simWidth * simHeight);
        mistCurrent = new Float32Array(simWidth * simHeight);
        mistNext = new Float32Array(simWidth * simHeight);
        encodedField = new Uint8Array(simWidth * simHeight * 4);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, waterTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          simWidth,
          simHeight,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          encodedField
        );
        uploadWaterField();
      }
      draw(performance.now());
    };

    const stepSimulation = (nowMs: number) => {
      next.fill(0);
      mistNext.fill(0);
      const waveStrength = 0.31;

      // Emissor autónomo suave (garante vida contínua estilo Lusion mesmo sem mover o rato)
      const t = (nowMs - startTime) * 0.001;
      if (variant === "hero" && Math.random() < 0.18) {
        const autoX = 0.5 + Math.sin(t * 0.75) * 0.34;
        const autoY = 0.5 + Math.cos(t * 0.58) * 0.28;
        const dirAngle = t * 0.9 + Math.PI * 0.5;
        injectWake(
          autoX,
          autoY,
          Math.cos(dirAngle),
          Math.sin(dirAngle),
          0.018
        );
      }

      for (let y = 1; y < simHeight - 1; y += 1) {
        for (let x = 1; x < simWidth - 1; x += 1) {
          const index = y * simWidth + x;
          const laplacian =
            current[index - 1] +
            current[index + 1] +
            current[index - simWidth] +
            current[index + simWidth] -
            4 * current[index];

          next[index] =
            (2 * current[index] -
              previous[index] +
              waveStrength * laplacian) *
            dampingFactor;

          const mistAverage =
            (mistCurrent[index - 1] +
              mistCurrent[index + 1] +
              mistCurrent[index - simWidth] +
              mistCurrent[index + simWidth]) *
            0.25;
          mistNext[index] =
            (mistCurrent[index] * 0.78 + mistAverage * 0.22) * 0.972;
        }
      }

      const oldPrevious = previous;
      previous = current;
      current = next;
      next = oldPrevious;

      const oldMist = mistCurrent;
      mistCurrent = mistNext;
      mistNext = oldMist;

      pointerActive *= 0.95;
      scrollVelocity *= 0.9;
    };

    const animate = (time: number) => {
      animationFrame = 0;
      if (disposed || reducedMotion || document.hidden) return;
      if (time - lastFrameTime >= 15) {
        lastFrameTime = time;
        stepSimulation(time);
        uploadWaterField();
        draw(time);
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!reducedMotion && !document.hidden && !animationFrame) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      const rect = container.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) {
        lastPointer = null;
        return;
      }

      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      pointerPos = { x, y };
      pointerActive = 1.0;

      if (!lastPointer) {
        lastPointer = { x, y };
        injectWake(x, y, 0.7, 0.7, 0.045);
        return;
      }

      const deltaX = (x - lastPointer.x) * simWidth;
      const deltaY = (y - lastPointer.y) * simHeight;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < 0.45) return;

      const directionX = deltaX / distance;
      const directionY = deltaY / distance;
      const steps = Math.min(18, Math.max(1, Math.ceil(distance / 3)));
      const strength = Math.min(0.115, 0.042 + distance * 0.00085);

      for (let step = 1; step <= steps; step += 1) {
        const fraction = step / steps;
        injectWake(
          lastPointer.x + (x - lastPointer.x) * fraction,
          lastPointer.y + (y - lastPointer.y) * fraction,
          directionX,
          directionY,
          strength / Math.sqrt(steps)
        );
      }

      lastPointer = { x, y };
      startAnimation();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (reducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        pointerPos = { x, y };
        pointerActive = 1.0;
        for (let i = 0; i < 12; i += 1) {
          const ang = (i / 12) * Math.PI * 2;
          injectWake(x, y, Math.cos(ang), Math.sin(ang), 0.085);
        }
        startAnimation();
      }
    };

    let lastScrollY = window.scrollY;
    const onScroll = () => {
      if (reducedMotion) return;
      const currentScrollY = window.scrollY;
      const deltaScroll = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      const rect = container.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (Math.abs(deltaScroll) > 0.5) {
        scrollVelocity = Math.max(
          -1.5,
          Math.min(1.5, deltaScroll * 0.035)
        );
        const scrollStrength = Math.min(
          0.095,
          0.028 + Math.abs(deltaScroll) * 0.0024
        );
        const dirY = deltaScroll > 0 ? -1 : 1;
        // Frente hidrodinâmica transversal gerada pelo scroll (efeito de água no scroll estilo Lusion)
        const wavePoints = 6;
        for (let k = 0; k < wavePoints; k += 1) {
          const px =
            0.08 +
            (k / (wavePoints - 1)) * 0.84 +
            (Math.random() - 0.5) * 0.06;
          const py =
            deltaScroll > 0
              ? 0.25 + (Math.random() - 0.5) * 0.35
              : 0.75 + (Math.random() - 0.5) * 0.35;
          injectWake(
            px,
            py,
            (Math.random() - 0.5) * 0.55,
            dirY,
            scrollStrength
          );
        }
        startAnimation();
      }
    };

    const onBlur = () => {
      lastPointer = null;
    };

    const onVisibilityChange = () => {
      if (document.hidden && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (!document.hidden && !reducedMotion) {
        startAnimation();
      }
    };

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        previous.fill(0);
        current.fill(0);
        next.fill(0);
        mistCurrent.fill(0);
        mistNext.fill(0);
        uploadWaterField();
        draw(performance.now());
      } else {
        startAnimation();
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      simWidth,
      simHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      encodedField
    );

    // Ondas de abertura cinematográfica assim que a página carrega
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      injectWake(
        0.5 + Math.cos(angle) * 0.14,
        0.55 + Math.sin(angle) * 0.12,
        Math.cos(angle),
        Math.sin(angle),
        0.068
      );
    }

    uploadWaterField();
    resize();
    draw(performance.now());
    startAnimation();

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery.addEventListener?.("change", onMotionPreferenceChange);

    return () => {
      disposed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotionQuery.removeEventListener?.(
        "change",
        onMotionPreferenceChange
      );
      gl.deleteTexture(waterTexture);
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
    };
  }, [damping, dropRadius, variant]);

  if (variant === "global") {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[5] overflow-hidden select-none ${className}`}
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none h-full w-full opacity-90 mix-blend-multiply"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative isolate w-full overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />
      <div className="relative z-10 pointer-events-none w-full">{children}</div>
    </div>
  );
};