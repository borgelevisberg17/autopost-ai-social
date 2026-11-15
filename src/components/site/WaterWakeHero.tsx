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

const FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D u_water;
  uniform vec2 u_waterTexel;
  varying vec2 v_uv;

  float readHeight(vec2 uv) {
    float encoded = texture2D(u_water, clamp(uv, 0.001, 0.999)).r;
    return (encoded - 0.5019608) * 0.796875;
  }

  float causticHighlight(float c) {
    return pow(c, 1.8) * 0.85;
  }

  void main() {
    float height = readHeight(v_uv);
    float hL = readHeight(v_uv - vec2(u_waterTexel.x, 0.0));
    float hR = readHeight(v_uv + vec2(u_waterTexel.x, 0.0));
    float hD = readHeight(v_uv - vec2(0.0, u_waterTexel.y));
    float hU = readHeight(v_uv + vec2(0.0, u_waterTexel.y));

    // Vetor de inclinação (slope / gradiente de superfície)
    vec2 slope = vec2(
      (hR - hL) / max(2.0 * u_waterTexel.x, 0.0001),
      (hU - hD) / max(2.0 * u_waterTexel.y, 0.0001)
    );

    float mist = texture2D(u_water, v_uv).g;
    float slopeStrength = length(slope);
    
    // Normal com amplitude aumentada para reflexão tridimensional rica (estilo Lusion)
    vec3 normal = normalize(vec3(-slope * 0.165, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    // 1. Dispersão Cromática / Refração RGB (Prisma óptico do Lusion)
    float dispersion = 0.032 * smoothstep(0.012, 0.45, slopeStrength);
    float dispR = readHeight(v_uv + slope * dispersion * 1.8);
    float dispB = readHeight(v_uv - slope * dispersion * 1.8);

    // 2. Curvatura de crista e Cáusticas (Laplaciano)
    float laplacian = (hR + hL + hU + hD - 4.0 * height);
    float caustics = clamp(-laplacian * 46.0, 0.0, 1.0) * smoothstep(0.015, 0.32, slopeStrength);

    // 3. Iluminação Especular (Luz solar chave + luz secundária de preenchimento)
    vec3 keyLight = normalize(vec3(-0.35, 0.52, 0.78));
    vec3 rimLight = normalize(vec3(0.42, -0.38, 0.82));
    
    vec3 halfKey = normalize(keyLight + viewDir);
    vec3 halfRim = normalize(rimLight + viewDir);
    
    float waterEdge = smoothstep(0.018, 0.38, slopeStrength);
    float specKey = pow(max(dot(normal, halfKey), 0.0), 36.0) * waterEdge;
    float specRim = pow(max(dot(normal, halfRim), 0.0), 18.0) * waterEdge;
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);

    // 4. Componentes de corpo líquido (Cristas, Vales e Halo de névoa)
    float crest = smoothstep(0.0018, 0.024, max(height, 0.0));
    float trough = smoothstep(0.0018, 0.028, max(-height, 0.0));
    float softBody = smoothstep(0.012, 0.14, mist);

    // 5. Paleta Lusion: Oceano Turquesa, Cobalto Profundo, Violeta Prismático e Diamante Especular
    vec3 baseColor = vec3(0.08, 0.62, 0.58); // Aqua/Esmeralda luminosa Vendora
    vec3 deepTrough = vec3(0.03, 0.18, 0.34); // Cobalto oceânico profundo
    vec3 crestColor = vec3(0.55, 0.94, 0.90); // Crista turquesa cintilante
    vec3 prismViolet = vec3(0.58, 0.32, 0.92); // Borda cromática violeta
    vec3 specularColor = vec3(0.98, 1.0, 1.0); // Brilho de sol puro

    vec3 finalColor = baseColor;
    finalColor = mix(finalColor, deepTrough, trough * 0.78);
    finalColor = mix(finalColor, crestColor, crest * 0.82);
    
    // Injeção da dispersão cromática nas bordas de alta velocidade
    finalColor.r += smoothstep(0.002, 0.03, max(dispR, 0.0)) * 0.28;
    finalColor.b += smoothstep(0.002, 0.03, max(-dispB, 0.0)) * 0.35;
    finalColor = mix(finalColor, prismViolet, smoothstep(0.12, 0.45, slopeStrength) * 0.35);

    // Adiciona cáusticas e reflexos de crista
    finalColor += causticHighlight(caustics) * vec3(0.5, 0.95, 0.88);
    finalColor = mix(finalColor, specularColor, clamp((specKey * 2.2 + specRim * 1.2), 0.0, 0.95));

    // Alpha volumétrico: visível, tátil e de alto impacto (até 0.68 em picos)
    float alpha = clamp(
      softBody * 0.22 + 
      trough * 0.38 + 
      crest * 0.42 + 
      caustics * 0.35 + 
      (specKey + specRim) * 0.55 + 
      fresnel * 0.25, 
      0.0, 
      0.68
    );

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

    // O fundo branco permanece intacto se WebGL não estiver disponível.
    if (!gl) return;

    let disposed = false;
    const simWidth = 160;
    let simHeight = 128;
    let previous = new Float32Array(simWidth * simHeight);
    let current = new Float32Array(simWidth * simHeight);
    let next = new Float32Array(simWidth * simHeight);
    let mistCurrent = new Float32Array(simWidth * simHeight);
    let mistNext = new Float32Array(simWidth * simHeight);
    let encodedField = new Uint8Array(simWidth * simHeight * 4);
    let lastPointer: { x: number; y: number } | null = null;
    let animationFrame = 0;
    let activeFrames = 0;
    let lastFrameTime = 0;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = reducedMotionQuery.matches;
    const dampingFactor = Math.max(0.94, Math.min(0.999, damping));
    const encodeScale = 320;

    const compileShader = (
      type: number,
      source: string,
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("WaterWakeHero shader compilation failed:", gl.getShaderInfoLog(shader));
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
      console.warn("WaterWakeHero program link failed:", gl.getProgramInfoLog(program));
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
      gl.STATIC_DRAW,
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uniforms = {
      water: gl.getUniformLocation(program, "u_water"),
      waterTexel: gl.getUniformLocation(program, "u_waterTexel"),
    };

    const uploadWaterField = () => {
      const pixelCount = simWidth * simHeight;
      for (let i = 0; i < pixelCount; i += 1) {
        const value = Math.max(-0.22, Math.min(0.22, current[i]));
        const offset = i * 4;
        encodedField[offset] = Math.max(
          0,
          Math.min(255, Math.round(128 + value * encodeScale)),
        );
        encodedField[offset + 1] = Math.max(
          0,
          Math.min(255, Math.round(mistCurrent[i] * 255)),
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
        encodedField,
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
      gl.uniform2f(uniforms.waterTexel, 1 / simWidth, 1 / simHeight);
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
        Math.min(256, Math.round(simWidth * (rect.height / rect.width))),
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
          encodedField,
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
      strength: number,
    ) => {
      const centerX = x * (simWidth - 1);
      const centerY = y * (simHeight - 1);
      const wakeLength = Math.max(6, Math.min(simWidth, simHeight) * 0.045);
      const maxSpread = 1.3 + wakeLength * 0.22;
      const extent = wakeLength + maxSpread;
      const coreRadius = Math.max(0.7, dropRadius * Math.min(simWidth, simHeight) * 0.42);
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
            -((along * along) / (coreRadius * coreRadius * 2) +
              (across * across) / (coreRadius * coreRadius * 0.72)),
          );

          let wings = 0;
          if (behind > 0 && behind < wakeLength) {
            const spread = 0.5 + behind * 0.12;
            const wingWidth = 0.34 + behind * 0.01;
            const wingDistance = Math.abs(across) - spread;
            const widthFalloff = Math.exp(
              -(wingDistance * wingDistance) / (wingWidth * wingWidth * 1.8),
            );
            const lengthFalloff = Math.exp(-behind / (wakeLength * 0.8));
            wings = widthFalloff * lengthFalloff;
          }

          current[index] = Math.max(
            -0.22,
            Math.min(0.22, current[index] + strength * (wings * 0.95 - center * 1.2)),
          );
          mistCurrent[index] = Math.min(
            0.38,
            mistCurrent[index] + strength * 1.25 * (wings * 0.7 + center * 0.25),
          );
        }
      }
    };

    const stepSimulation = () => {
      next.fill(0);
      mistNext.fill(0);
      const waveStrength = 0.28;

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
            (2 * current[index] - previous[index] + waveStrength * laplacian) *
            dampingFactor;

          const mistAverage =
            (mistCurrent[index - 1] +
              mistCurrent[index + 1] +
              mistCurrent[index - simWidth] +
              mistCurrent[index + simWidth]) *
            0.25;
          mistNext[index] =
            (mistCurrent[index] * 0.78 + mistAverage * 0.22) * 0.965;
        }
      }

      const oldPrevious = previous;
      previous = current;
      current = next;
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
      activeFrames = 210;
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
      if (distance < 0.8) return;

      const directionX = deltaX / distance;
      const directionY = deltaY / distance;
      const steps = Math.min(14, Math.max(1, Math.ceil(distance / 4)));
      const strength = Math.min(0.065, 0.022 + distance * 0.00038);

      for (let step = 1; step <= steps; step += 1) {
        const fraction = step / steps;
        injectWake(
          lastPointer.x + (x - lastPointer.x) * fraction,
          lastPointer.y + (y - lastPointer.y) * fraction,
          directionX,
          directionY,
          strength / Math.sqrt(steps),
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
        for (let i = 0; i < 8; i += 1) {
          const ang = (i / 8) * Math.PI * 2;
          injectWake(x, y, Math.cos(ang), Math.sin(ang), 0.052);
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

      if (Math.abs(deltaScroll) > 1.0) {
        const scrollStrength = Math.min(0.048, Math.abs(deltaScroll) * 0.0016);
        const dirY = deltaScroll > 0 ? -1 : 1;
        for (let k = 0; k < 3; k += 1) {
          const px = 0.2 + k * 0.3 + (Math.random() - 0.5) * 0.12;
          const py = deltaScroll > 0 ? 0.8 : 0.2;
          injectWake(px, py, (Math.random() - 0.5) * 0.4, dirY, scrollStrength);
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
      encodedField,
    );

    uploadWaterField();
    resize();
    draw();
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
      reducedMotionQuery.removeEventListener?.("change", onMotionPreferenceChange);
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
