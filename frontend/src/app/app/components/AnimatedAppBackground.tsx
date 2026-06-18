"use client";

import { useEffect, useRef } from "react";

type DotField = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  density: number;
  driftX: number;
  driftY: number;
  phase: number;
};

const dotFields: DotField[] = [
  { x: -0.02, y: 0.12, rx: 0.28, ry: 0.2, density: 7, driftX: 42, driftY: 24, phase: 0.2 },
  { x: 0.16, y: 0.38, rx: 0.18, ry: 0.2, density: 7, driftX: -30, driftY: 34, phase: 1.8 },
  { x: 0.55, y: 0.12, rx: 0.16, ry: 0.15, density: 6, driftX: 30, driftY: -24, phase: 3.1 },
  { x: 0.78, y: 0.62, rx: 0.12, ry: 0.12, density: 6, driftX: -26, driftY: 30, phase: 4.4 },
  { x: 0.06, y: 0.92, rx: 0.12, ry: 0.1, density: 6, driftX: 22, driftY: -22, phase: 5.2 },
  { x: 0.34, y: 0.72, rx: 0.12, ry: 0.18, density: 7, driftX: -24, driftY: -32, phase: 2.7 },
  { x: 1.02, y: 0.24, rx: 0.12, ry: 0.17, density: 6, driftX: -34, driftY: 24, phase: 0.9 },
];

export default function AnimatedAppBackground() {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const background = backgroundRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const canvasElement = canvas;
    const canvasContext = context;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: 0,
      targetActive: 0,
    };

    function resizeCanvas() {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasElement.width = Math.floor(width * pixelRatio);
      canvasElement.height = Math.floor(height * pixelRatio);
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;
      canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function drawField(field: DotField, time: number, isLight: boolean) {
      const breath = Math.sin(time * 0.22 + field.phase) * 0.055;
      const pointerInfluence = pointer.active * (0.72 + field.rx);
      const pointerOffsetX = pointer.x * width * 0.038 * pointerInfluence;
      const pointerOffsetY = pointer.y * height * 0.03 * pointerInfluence;
      const centerX =
        field.x * width +
        Math.sin(time * 0.34 + field.phase) * field.driftX +
        Math.sin(time * 0.16 + field.phase * 1.7) * field.driftY * 0.28 +
        pointerOffsetX;
      const centerY =
        field.y * height +
        Math.cos(time * 0.28 + field.phase) * field.driftY +
        Math.cos(time * 0.14 + field.phase * 1.4) * field.driftX * 0.2 +
        pointerOffsetY;
      const radiusX = field.rx * width * (1 + breath);
      const radiusY = field.ry * height * (1 - breath * 0.55);
      const dotGap = Math.max(5, field.density * Math.min(width / 1440, 1.1));
      const dotSize = Math.max(0.75, dotGap * 0.16);
      const startX = centerX - radiusX;
      const endX = centerX + radiusX;
      const startY = centerY - radiusY;
      const endY = centerY + radiusY;

      for (let y = startY; y <= endY; y += dotGap) {
        for (let x = startX; x <= endX; x += dotGap) {
          const nx = (x - centerX) / radiusX;
          const ny = (y - centerY) / radiusY;
          const distance = nx * nx + ny * ny;
          if (distance > 1) continue;

          const edgeFade = Math.pow(1 - distance, 1.55);
          const wave = 0.72 + Math.sin(time * 0.48 + nx * 5 + ny * 4 + field.phase) * 0.28;
          const pointerDistance = Math.hypot(
            (x - (pointer.x * 0.5 + 0.5) * width) / Math.max(width * 0.32, 1),
            (y - (pointer.y * 0.5 + 0.5) * height) / Math.max(height * 0.38, 1)
          );
          const pointerBloom =
            pointer.active * Math.max(0, 1 - pointerDistance) * (isLight ? 0.12 : 0.16);
          const alpha = edgeFade * wave * (isLight ? 0.24 : 0.27) + pointerBloom * edgeFade;
          canvasContext.fillStyle = isLight
            ? `rgba(10, 10, 12, ${alpha})`
            : `rgba(248, 250, 252, ${alpha})`;
          canvasContext.beginPath();
          canvasContext.arc(x, y, dotSize, 0, Math.PI * 2);
          canvasContext.fill();
        }
      }
    }

    function drawAmbientWave(time: number, isLight: boolean) {
      const waveX =
        width * (0.5 + Math.sin(time * 0.2) * 0.035 + pointer.x * 0.04 * pointer.active);
      const waveY =
        height * (0.46 + Math.cos(time * 0.17) * 0.028 + pointer.y * 0.032 * pointer.active);
      const radius = Math.max(width, height) * (0.42 + Math.sin(time * 0.18) * 0.04);
      const gradient = canvasContext.createRadialGradient(
        waveX,
        waveY,
        radius * 0.16,
        waveX,
        waveY,
        radius
      );

      if (isLight) {
        gradient.addColorStop(0, "rgba(10, 10, 12, 0.05)");
        gradient.addColorStop(0.48, "rgba(10, 10, 12, 0.018)");
        gradient.addColorStop(1, "rgba(10, 10, 12, 0)");
      } else {
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.085)");
        gradient.addColorStop(0.48, "rgba(255, 255, 255, 0.032)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      }

      canvasContext.fillStyle = gradient;
      canvasContext.fillRect(0, 0, width, height);
    }

    function draw(timeStamp: number) {
      const time = timeStamp * 0.001;
      const isLight = document.documentElement.classList.contains("light");

      pointer.x += (pointer.targetX - pointer.x) * 0.075;
      pointer.y += (pointer.targetY - pointer.y) * 0.075;
      pointer.active += (pointer.targetActive - pointer.active) * 0.055;

      canvasContext.clearRect(0, 0, width, height);
      drawAmbientWave(time, isLight);
      dotFields.forEach((field) => drawField(field, time, isLight));

      if (!reducedMotion.matches) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.targetX = (event.clientX / Math.max(width, 1)) * 2 - 1;
      pointer.targetY = (event.clientY / Math.max(height, 1)) * 2 - 1;
      pointer.targetActive = 1;
      background?.style.setProperty("--soterra-pointer-x", `${event.clientX}px`);
      background?.style.setProperty("--soterra-pointer-y", `${event.clientY}px`);
    }

    function handlePointerLeave() {
      pointer.targetActive = 0;
      pointer.targetX = 0;
      pointer.targetY = 0;
    }

    resizeCanvas();
    draw(0);

    if (!reducedMotion.matches) {
      animationFrame = window.requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <div ref={backgroundRef} aria-hidden="true" className="soterra-app-background">
      <canvas ref={canvasRef} className="soterra-app-background__canvas" />
      <div className="soterra-app-background__mist soterra-app-background__mist--one" />
      <div className="soterra-app-background__mist soterra-app-background__mist--two" />
      <div className="soterra-app-background__readability" />
    </div>
  );
}
