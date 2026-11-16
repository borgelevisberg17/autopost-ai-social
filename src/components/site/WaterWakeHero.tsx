import React, { useEffect, useRef } from "react";

interface WaterWakeHeroProps {
  children?: React.ReactNode;
  damping?: number;
  dropRadius?: number;
  className?: string;
}

const VERTEX_SHADER = `
  attribute vec2 a_pos;
  varying vec2 v_uv;

  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

/**
 * Fragment Shader com interpolação Quintic C2 (Smootherstep) e descodificação de 16 bits (R + B/255).
 * Elimina 100% o efeito de "quadrados / pixeis" quando a onda desacelera e desaparece,
 * garantindo derivadas de superfície (normais) perfeitamente orgânicas e contínuas.
 */
const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D u_water;
  uniform vec2 u_gridSize;
  varying vec2 v_uv;

  // Descodifica altura de 16-bit (canal R = byte alto, canal B = byte baixo) + bruma (canal G)
  vec2 decodeTexel(vec2 uv) {
    vec4 raw = texture2D(u_water, clamp(uv, 0.001, 0.999));
    float height16 = (raw.r * 255.0 + raw.b) / 255.0;
    float height = (height16 - 0.5) * 0.44;
    return vec2(height, raw.g);
  }

  // Interpolação Quintic C2 (6t^5 - 15t^4 + 10t^3): derivada 1ª e 2ª contínuas, zero blocos quadrados
  vec2 sampleSmoothWater(vec2 uv) {
    vec2 coord = uv * u_gridSize - 0.5;
    vec2 base = floor(coord);
    vec2 f = clamp(coord - base, 0.0, 1.0);

    // Polinómio Quintic de Perlin: garante suavidade C2 absoluta entre células da grelha
    vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    vec2 invGrid = 1.0 / u_gridSize;
    vec2 uv00 = (base + vec2(0.5, 0.5)) * invGrid;
    vec2 uv10 = (base + vec2(1.5, 0.5)) * invGrid;
    vec2 uv01 = (base + vec2(0.5, 1.5)) * invGrid;
    vec2 uv11 = (base + vec2(1.5, 1.5)) * invGrid;

    vec2 c00 = decodeTexel(uv00);
    vec2 c10 = decodeTexel(uv10);
    vec2 c01 = decodeTexel(uv01);
    vec2 c11 = decodeTexel(uv11);

    return mix(mix(c00, c10, w.x), mix(c01, c11, w.x), w.y);
  }

  void main() {
    vec2 stepUV = 1.35 / u_gridSize;

    vec2 centerSample = sampleSmoothWater(v_uv);
    float height = centerSample.x;
    float mist = centerSample.y;

    float hL = sampleSmoothWater(v_uv - vec2(stepUV.x, 0.0)).x;
    float hR = sampleSmoothWater(v_uv + vec2(stepUV.x, 0.0)).x;
    float hD = sampleSmoothWater(v_uv - vec2(0.0, stepUV.y)).x;
    float hU = sampleSmoothWater(v_uv + vec2(0.0, stepUV.y)).x;

    vec2 slope = vec2(
      (hR - hL) / max(2.0 * stepUV.x, 0.0001),
      (hU - hD) / max(2.0 * stepUV.y, 0.0001)
    );

    float slopeStrength = length(slope);
    vec3 normal = normalize(vec3(-slope * 0.16, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    vec3 keyLight = normalize(vec3(-0.34, 0.52, 0.78));
    vec3 rimLight = normalize(vec3(0.42, -0.36, 0.83));
    vec3 halfKey = normalize(keyLight + viewDir);
    vec3 halfRim = normalize(rimLight + viewDir);

    float waterEdge = smoothstep(0.008, 0.34, slopeStrength);
    float specKey = pow(max(dot(normal, halfKey), 0.0), 34.0) * waterEdge;
    float specRim = pow(max(dot(normal, halfRim), 0.0), 16.0) * waterEdge;
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.6);

    float crest = smoothstep(0.0012, 0.024, max(height, 0.0));
    float trough = smoothstep(0.0012, 0.028, max(-height, 0.0));
    float softBody = smoothstep(0.006, 0.14, mist);

    // Optical crystalline liquid with subtle chromatic refraction
    vec3 baseColor = vec3(0.12, 0.68, 0.60);
    vec3 prismRim = vec3(0.45, 0.40, 0.82); // Chromatic prism refraction on Fresnel rim
    vec3 deepTrough = vec3(0.06, 0.24, 0.32);
    vec3 crestColor = vec3(0.88, 0.98, 0.96); // Crystalline highlight
    vec3 specularColor = vec3(1.0, 1.0, 1.0);

    vec3 finalColor = mix(baseColor, prismRim, fresnel * 0.65);
    finalColor = mix(finalColor, deepTrough, trough * 0.55);
    finalColor = mix(finalColor, crestColor, crest * 0.70);
    finalColor = mix(
      finalColor,
      specularColor,
      clamp(specKey * 2.4 + specRim * 1.3, 0.0, 0.98)
    );

    float alpha = clamp(
      softBody * 0.12 +
      trough * 0.20 +
      crest * 0.26 +
      (specKey + specRim) * 0.46 +
      fresnel * 0.16,
      0.0,
      0.46
    );

    // Fade suave a zero para nunca deixar resíduos quando a onda termina
    alpha *= smoothstep(0.0004, 0.006, slopeStrength + mist * 0.12 + abs(height));

    gl_FragColor = vec4(finalColor * alpha, alpha);
  }
`;

export const WaterWakeHero: React.FC<WaterWakeHeroProps> = ({
  children,
  damping = 0.991,
  dropRadius = 0.024,
  className = "",
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
    const simWidth = 180;
    let simHeight = 140;

    let previous = new Float32Array(simWidth * simHeight);
    let current = new Float32Array(simWidth * simHeight);
    let next = new Float32Array(simWidth * simHeight);
    let smoothed = new Float32Array(simWidth * simHeight);
    let mistCurrent = new Float32Array(simWidth * simHeight);
    let mistNext = new Float32Array(simWidth * simHeight);
    let encodedField = new Uint8Array(simWidth * simHeight * 4);

    // Inicializa com repouso exato em 0.5 (16-bit: R=128, B=0)
    for (let i = 0; i < simWidth * simHeight; i += 1) {
      encodedField[i * 4] = 128;
      encodedField[i * 4 + 1] = 0;
      encodedField[i * 4 + 2] = 0;
      encodedField[i * 4 + 3] = 255;
    }

    let lastPointer: { x: number; y: number } | null = null;
    let animationFrame = 0;
    let activeFrames = 0;
    let lastFrameTime = 0;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    let reducedMotion = reducedMotionQuery.matches;
    const dampingFactor = Math.max(0.94, Math.min(0.998, damping));

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

    // Usamos NEAREST na textura pois o próprio shader faz interpolação Quintic C2 de 16 bits
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uniforms = {
      water: gl.getUniformLocation(program, "u_water"),
      gridSize: gl.getUniformLocation(program, "u_gridSize"),
    };

    const uploadWaterField = () => {
      const pixelCount = simWidth * simHeight;
      for (let i = 0; i < pixelCount; i += 1) {
        const clamped = Math.max(-0.22, Math.min(0.22, current[i]));
        const norm = Math.max(0, Math.min(1, 0.5 + clamped / 0.44));
        const encoded16 = Math.round(norm * 65280); // 255 * 256
        const highByte = (encoded16 >> 8) & 255;
        const lowByte = encoded16 & 255;

        const offset = i * 4;
        encodedField[offset] = highByte;
        encodedField[offset + 1] = Math.max(
          0,
          Math.min(255, Math.round(mistCurrent[i] * 255))
        );
        encodedField[offset + 2] = lowByte;
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

    const draw = () => {
      if (disposed || canvas.width === 0 || canvas.height === 0) return;
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
      gl.uniform2f(uniforms.gridSize, simWidth, simHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
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
        96,
        Math.min(256, Math.round(simWidth * (rect.height / rect.width)))
      );
      if (newSimHeight !== simHeight) {
        simHeight = newSimHeight;
        previous = new Float32Array(simWidth * simHeight);
        current = new Float32Array(simWidth * simHeight);
        next = new Float32Array(simWidth * simHeight);
        smoothed = new Float32Array(simWidth * simHeight);
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
      draw();
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
      const wakeLength = Math.max(7, Math.min(simWidth, simHeight) * 0.055);
      const maxSpread = 1.6 + wakeLength * 0.24;
      const extent = wakeLength + maxSpread;
      const coreRadius = Math.max(
        1.1,
        dropRadius * Math.min(simWidth, simHeight) * 0.52
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
              (across * across) / (coreRadius * coreRadius * 0.9)
            )
          );

          let wings = 0;
          if (behind > 0 && behind < wakeLength) {
            const spread = 0.55 + behind * 0.13;
            const wingWidth = 0.42 + behind * 0.014;
            const wingDistance = Math.abs(across) - spread;
            const widthFalloff = Math.exp(
              -(wingDistance * wingDistance) / (wingWidth * wingWidth * 2.2)
            );
            const lengthFalloff = Math.exp(-behind / (wakeLength * 0.85));
            wings = widthFalloff * lengthFalloff;
          }

          current[index] = Math.max(
            -0.22,
            Math.min(
              0.22,
              current[index] + strength * (wings * 0.95 - center * 1.15)
            )
          );
          mistCurrent[index] = Math.min(
            0.42,
            mistCurrent[index] +
              strength * 1.25 * (wings * 0.72 + center * 0.28)
          );
        }
      }
    };

    const stepSimulation = () => {
      next.fill(0);
      mistNext.fill(0);
      const waveStrength = 0.26;

      // Laplaciano isotrópico de 9 pontos (elimina ondas quadradas nos eixos X/Y)
      for (let y = 1; y < simHeight - 1; y += 1) {
        for (let x = 1; x < simWidth - 1; x += 1) {
          const idx = y * simWidth + x;
          const c = current[idx];

          const axial =
            current[idx - 1] +
            current[idx + 1] +
            current[idx - simWidth] +
            current[idx + simWidth];
          const diag =
            current[idx - simWidth - 1] +
            current[idx - simWidth + 1] +
            current[idx + simWidth - 1] +
            current[idx + simWidth + 1];

          // Stencil isotrópico: 0.20 * axial + 0.05 * diagonal - 1.0 * centro
          const isotropicLaplacian = (axial * 0.2 + diag * 0.05 - c) * 4.0;

          let val =
            (2 * c - previous[idx] + waveStrength * isotropicLaplacian) *
            dampingFactor;

          // Dissipação limpa de sub-ruído
          if (Math.abs(val) < 0.00004) val = 0;
          next[idx] = val;

          const mistAvg = (mistCurrent[idx - 1] +
            mistCurrent[idx + 1] +
            mistCurrent[idx - simWidth] +
            mistCurrent[idx + simWidth]) *
            0.2 +
            (mistCurrent[idx - simWidth - 1] +
              mistCurrent[idx - simWidth + 1] +
              mistCurrent[idx + simWidth - 1] +
              mistCurrent[idx + simWidth + 1]) *
              0.05;

          const mVal = (mistCurrent[idx] * 0.74 + mistAvg * 0.26) * 0.968;
          mistNext[idx] = mVal < 0.0001 ? 0 : mVal;
        }
      }

      // Micro-filtro Gaussiano espacial (elimina qualquer oscilação de alta frequência célula-a-célula)
      for (let y = 1; y < simHeight - 1; y += 1) {
        for (let x = 1; x < simWidth - 1; x += 1) {
          const idx = y * simWidth + x;
          const neighbors =
            (next[idx - 1] +
              next[idx + 1] +
              next[idx - simWidth] +
              next[idx + simWidth]) *
            0.25;
          smoothed[idx] = next[idx] * 0.94 + neighbors * 0.06;
        }
      }

      const oldPrevious = previous;
      previous = current;
      current = smoothed;
      smoothed = next;
      next = oldPrevious;

      const oldMist = mistCurrent;
      mistCurrent = mistNext;
      mistNext = oldMist;
    };

    const animate = (time: number) => {
      animationFrame = 0;
      if (disposed || reducedMotion || document.hidden) return;
      if (time - lastFrameTime < 15) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = time;
      stepSimulation();
      uploadWaterField();
      draw();
      activeFrames -= 1;
      if (activeFrames > 0) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const startAnimation = () => {
      activeFrames = 260;
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
      if (!lastPointer) {
        lastPointer = { x, y };
        return;
      }

      const deltaX = (x - lastPointer.x) * simWidth;
      const deltaY = (y - lastPointer.y) * simHeight;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < 0.7) return;

      const directionX = deltaX / distance;
      const directionY = deltaY / distance;
      const steps = Math.min(16, Math.max(1, Math.ceil(distance / 3.5)));
      const strength = Math.min(0.072, 0.025 + distance * 0.00042);

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

    const onBlur = () => {
      lastPointer = null;
    };

    const onVisibilityChange = () => {
      if (document.hidden && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (!document.hidden && activeFrames > 0 && !reducedMotion) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        activeFrames = 0;
        previous.fill(0);
        current.fill(0);
        next.fill(0);
        smoothed.fill(0);
        mistCurrent.fill(0);
        mistNext.fill(0);
        uploadWaterField();
        draw();
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

    uploadWaterField();
    resize();
    draw();

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery.addEventListener?.("change", onMotionPreferenceChange);

    return () => {
      disposed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
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
  }, [damping, dropRadius]);

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