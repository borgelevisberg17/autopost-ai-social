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

  void main() {
    float height = readHeight(v_uv);
    float hL = readHeight(v_uv - vec2(u_waterTexel.x, 0.0));
    float hR = readHeight(v_uv + vec2(u_waterTexel.x, 0.0));
    float hD = readHeight(v_uv - vec2(0.0, u_waterTexel.y));
    float hU = readHeight(v_uv + vec2(0.0, u_waterTexel.y));

    vec2 slope = vec2(
      (hR - hL) / max(2.0 * u_waterTexel.x, 0.0001),
      (hU - hD) / max(2.0 * u_waterTexel.y, 0.0001)
    );

    float mist = texture2D(u_water, v_uv).g;
    float slopeStrength = length(slope);
    float waterEdge = smoothstep(0.025, 0.34, slopeStrength);
    float softBody = smoothstep(0.014, 0.11, mist) * 0.065;
    float trough = smoothstep(0.0015, 0.02, max(-height, 0.0)) * 0.18;
    float crest = smoothstep(0.0015, 0.02, max(height, 0.0)) * 0.15;

    vec3 normal = normalize(vec3(-slope * 0.085, 1.0));
    vec3 lightDirection = normalize(vec3(-0.10, 0.20, 0.97));
    float specular = pow(max(dot(normal, lightDirection), 0.0), 20.0) * waterEdge;

    // Sulco aqua estreito; a névoa é apenas um halo leve em redor das cristas.
    vec3 color = vec3(0.34, 0.68, 0.65);
    color = mix(color, vec3(0.74, 0.95, 0.92), smoothstep(0.005, 0.03, max(height, 0.0)));
    color = mix(color, vec3(0.04, 0.24, 0.25), smoothstep(0.003, 0.028, max(-height, 0.0)) * 0.72);
    color = mix(color, vec3(0.97, 1.0, 0.99), clamp(specular * 2.0, 0.0, 0.85));

    float alpha = clamp(softBody + trough + crest + specular * 0.22, 0.0, 0.17);
    gl_FragColor = vec4(color * alpha, alpha);
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
      const strength = Math.min(0.021, 0.008 + distance * 0.00014);

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
