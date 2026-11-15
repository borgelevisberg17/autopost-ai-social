import React, { useEffect, useRef } from "react";

interface WaterWakeHeroProps {
  imageUrl?: string;
  children?: React.ReactNode;
  damping?: number; // Quão rápido a onda desaparece (0.97 a 0.995)
  dropRadius?: number; // Largura do "casco do barco" / cursor
  className?: string;
}

export const WaterWakeHero: React.FC<WaterWakeHeroProps> = ({
  imageUrl,
  children,
  damping = 0.991,
  dropRadius = 0.024,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL context setup (supports WebGL2 or WebGL1 with extensions)
    const gl =
      (canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        depth: false,
      }) as WebGLRenderingContext | null) ||
      (canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
      }) as WebGLRenderingContext | null);

    if (!gl) return;

    // Habilita texturas de ponto flutuante para precisão na física da água
    const extFloat = gl.getExtension("OES_texture_float");
    const extHalfFloat = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("OES_texture_half_float_linear");

    const texType = extFloat
      ? gl.FLOAT
      : extHalfFloat
      ? (extHalfFloat as unknown as { HALF_FLOAT_OES: number }).HALF_FLOAT_OES
      : gl.UNSIGNED_BYTE;

    const SIM_RES = 256; // Resolução da grade física (256x256 é ultra fluida a 60fps)

    // Vertex Shader padrão para quad em tela cheia
    const quadVS = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // 1. Shader de "Drop": Injeta perturbação onde o barco/cursor passa
    const dropFS = `
      precision highp float;
      uniform sampler2D u_texture;
      uniform vec2 u_center;
      uniform float u_radius;
      uniform float u_strength;
      varying vec2 v_uv;

      void main() {
        vec4 info = texture2D(u_texture, v_uv);
        float drop = max(0.0, 1.0 - length(u_center - v_uv) / u_radius);
        drop = 0.5 - cos(drop * 3.14159265) * 0.5;
        info.r += drop * u_strength;
        gl_FragColor = info;
      }
    `;

    // 2. Shader de Propagação: Calcula física da onda (média dos vizinhos + velocidade)
    const updateFS = `
      precision highp float;
      uniform sampler2D u_texture;
      uniform vec2 u_delta;
      uniform float u_damping;
      varying vec2 v_uv;

      void main() {
        vec4 info = texture2D(u_texture, v_uv);
        vec2 dx = vec2(u_delta.x, 0.0);
        vec2 dy = vec2(0.0, u_delta.y);

        // Média da altura dos 4 pixels vizinhos
        float average = (
          texture2D(u_texture, v_uv - dx).r +
          texture2D(u_texture, v_uv - dy).r +
          texture2D(u_texture, v_uv + dx).r +
          texture2D(u_texture, v_uv + dy).r
        ) * 0.25;

        // Atualiza velocidade (canal G) e altura (canal R)
        info.g += (average - info.r) * 2.0;
        info.g *= u_damping;
        info.r += info.g;

        gl_FragColor = info;
      }
    `;

    // 3. Shader de Renderização Final: Distorce a imagem de fundo + reflexo de luz especular
    const renderFS = `
      precision highp float;
      uniform sampler2D u_water;
      uniform sampler2D u_image;
      uniform vec2 u_delta;
      varying vec2 v_uv;

      void main() {
        vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
        
        // Calcula inclinação (normal) da superfície da água
        float hR = texture2D(u_water, v_uv + vec2(u_delta.x, 0.0)).r;
        float hL = texture2D(u_water, v_uv - vec2(u_delta.x, 0.0)).r;
        float hU = texture2D(u_water, v_uv + vec2(0.0, u_delta.y)).r;
        float hD = texture2D(u_water, v_uv - vec2(0.0, u_delta.y)).r;

        vec2 normal = vec2(hL - hR, hD - hU);

        // Refração física da imagem de fundo
        vec2 distortedUV = clamp(uv + normal * 0.45, 0.001, 0.999);
        vec4 color = texture2D(u_image, distortedUV);

        // Brilho especular (luz do sol batendo na crista do rastro da água)
        vec3 lightDir = normalize(vec3(0.4, 0.6, 1.0));
        vec3 surfNormal = normalize(vec3(normal.x * 14.0, normal.y * 14.0, 1.0));
        float specular = pow(max(dot(surfNormal, lightDir), 0.0), 32.0);
        
        // Adiciona o brilho reluzente da água
        color.rgb += vec3(specular * 0.55);

        gl_FragColor = color;
      }
    `;

    const createProgram = (fsSource: string) => {
      const vs = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vs, quadVS);
      gl.compileShader(vs);

      const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fs, fsSource);
      gl.compileShader(fs);

      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      return prog;
    };

    const dropProgram = createProgram(dropFS);
    const updateProgram = createProgram(updateFS);
    const renderProgram = createProgram(renderFS);

    // Geometria do plano quad
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const bindQuad = (prog: WebGLProgram) => {
      gl.useProgram(prog);
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    // Criação dos dois Framebuffers para Ping-Pong FBO
    const createFBO = () => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        SIM_RES,
        SIM_RES,
        0,
        gl.RGBA,
        texType,
        null
      );

      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0
      );
      return { tex, fbo };
    };

    let fboA = createFBO();
    let fboB = createFBO();

    const swapFBO = () => {
      const temp = fboA;
      fboA = fboB;
      fboB = temp;
    };

    // Textura da imagem de fundo (Gera a névoa líquida Kraft proceduralmente com alta fidelidade)
    const bgTex = gl.createTexture()!;
    const generateKraftAurora = () => {
      const c = document.createElement("canvas");
      c.width = 1920;
      c.height = 1080;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      // 1. Fundo etéreo luminoso suave
      ctx.fillStyle = "#fcfdfd";
      ctx.fillRect(0, 0, 1920, 1080);

      // 2. Nebulosa violeta/índigo esquerda (Kraft)
      const g1 = ctx.createRadialGradient(420, 440, 0, 420, 440, 720);
      g1.addColorStop(0, "rgba(55, 48, 163, 0.95)");
      g1.addColorStop(0.35, "rgba(88, 28, 135, 0.8)");
      g1.addColorStop(0.7, "rgba(30, 27, 75, 0.45)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, 1920, 1080);

      // 3. Nebulosa púrpura/ardósia direita (Kraft)
      const g2 = ctx.createRadialGradient(1540, 380, 0, 1540, 380, 680);
      g2.addColorStop(0, "rgba(109, 40, 217, 0.9)");
      g2.addColorStop(0.35, "rgba(67, 56, 202, 0.75)");
      g2.addColorStop(0.7, "rgba(15, 23, 42, 0.4)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, 1920, 1080);

      // 4. Fluxo oceânico profundo na base
      const g3 = ctx.createRadialGradient(960, 920, 0, 960, 920, 760);
      g3.addColorStop(0, "rgba(30, 58, 138, 0.92)");
      g3.addColorStop(0.4, "rgba(79, 70, 229, 0.72)");
      g3.addColorStop(0.75, "rgba(13, 148, 136, 0.35)");
      g3.addColorStop(1, "transparent");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, 1920, 1080);

      // 5. Difusor branco superior do topo Kraft
      const gTop = ctx.createLinearGradient(0, 0, 0, 520);
      gTop.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      gTop.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
      gTop.addColorStop(1, "transparent");
      ctx.fillStyle = gTop;
      ctx.fillRect(0, 0, 1920, 1080);

      gl.bindTexture(gl.TEXTURE_2D, bgTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    };

    // Inicializa imediatamente com a textura de névoa Kraft
    generateKraftAurora();

    // Se uma URL externa for fornecida, carrega por cima
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, bgTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      };
    }

    // Função para injetar onda em uma coordenada normalizada (0..1)
    const addDrop = (x: number, y: number, radius: number, strength: number) => {
      gl.viewport(0, 0, SIM_RES, SIM_RES);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
      bindQuad(dropProgram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
      gl.uniform1i(gl.getUniformLocation(dropProgram, "u_texture"), 0);
      gl.uniform2f(gl.getUniformLocation(dropProgram, "u_center"), x, y);
      gl.uniform1f(gl.getUniformLocation(dropProgram, "u_radius"), radius);
      gl.uniform1f(gl.getUniformLocation(dropProgram, "u_strength"), strength);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      swapFBO();
    };

    // Interpolação contínua entre o ponto anterior e atual do mouse (esteira ininterrupta como barco cortando água)
    let lastMouse: { x: number; y: number } | null = null;

    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = 1.0 - (clientY - rect.top) / rect.height;

      if (x < 0 || x > 1 || y < 0 || y > 1) {
        lastMouse = null;
        return;
      }

      if (lastMouse) {
        const dx = x - lastMouse.x;
        const dy = y - lastMouse.y;
        const dist = Math.hypot(dx, dy);
        // Divide o trajeto em passos finos para formar uma esteira contínua em V sem falhas
        const steps = Math.max(1, Math.floor(dist / 0.007));

        for (let i = 1; i <= steps; i++) {
          const ix = lastMouse.x + (dx * i) / steps;
          const iy = lastMouse.y + (dy * i) / steps;
          addDrop(ix, iy, dropRadius, 0.045);
        }
      } else {
        addDrop(x, y, dropRadius, 0.065);
      }

      lastMouse = { x, y };
    };

    const onMouseMove = (e: MouseEvent) =>
      handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0])
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onMouseLeave = () => {
      lastMouse = null;
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", handleResize);
    handleResize();

    // Gotas de água iniciais para dar vida ao carregar a página
    setTimeout(() => addDrop(0.5, 0.5, 0.04, 0.09), 300);
    setTimeout(() => addDrop(0.35, 0.6, 0.035, 0.07), 600);
    setTimeout(() => addDrop(0.65, 0.45, 0.035, 0.07), 900);

    let animId: number;
    const step = () => {
      // Passo 1: Atualiza a física da água (2 iterações por frame deixam a onda veloz e fluida)
      for (let i = 0; i < 2; i++) {
        gl.viewport(0, 0, SIM_RES, SIM_RES);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
        bindQuad(updateProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
        gl.uniform1i(gl.getUniformLocation(updateProgram, "u_texture"), 0);
        gl.uniform2f(
          gl.getUniformLocation(updateProgram, "u_delta"),
          1 / SIM_RES,
          1 / SIM_RES
        );
        gl.uniform1f(gl.getUniformLocation(updateProgram, "u_damping"), damping);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        swapFBO();
      }

      // Passo 2: Renderiza na tela com refração e brilho especular nas cristas
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      bindQuad(renderProgram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
      gl.uniform1i(gl.getUniformLocation(renderProgram, "u_water"), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bgTex);
      gl.uniform1i(gl.getUniformLocation(renderProgram, "u_image"), 1);

      gl.uniform2f(
        gl.getUniformLocation(renderProgram, "u_delta"),
        1 / SIM_RES,
        1 / SIM_RES
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(step);
    };

    step();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [imageUrl, damping, dropRadius]);

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none z-0"
      />
      {/* O container z-10 pointer-events-none garante que o mouse corta a água livremente */}
      <div className="relative z-10 pointer-events-none w-full">
        {children}
      </div>
    </div>
  );
};
