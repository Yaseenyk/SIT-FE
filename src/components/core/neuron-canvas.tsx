"use client";

import { useEffect, useRef } from "react";

/**
 * The animated neural-network background.
 *
 * A faithful port of `initNeuron()` from the original single-file site — drifting nodes,
 * lines between any pair closer than 150px, brighter lines toward the pointer — with three
 * corrections the original needed:
 *
 *   1. **It stops.** The original called requestAnimationFrame forever, with no way to
 *      cancel. In a single-page site that never unmounted anything, that was survivable;
 *      in React it would leak one animation loop per mount, all of them still drawing to
 *      detached canvases.
 *   2. **It honours prefers-reduced-motion.** A full-screen field of moving particles is
 *      exactly the content that setting exists for. Reduced motion renders one static
 *      frame rather than nothing, so the section keeps its texture.
 *   3. **It is sharp on retina screens.** The original set canvas.width to the CSS width,
 *      so every line was drawn at half resolution and looked soft.
 *
 * The WebGL/Three.js hero variant (`initHero3D`) is deliberately NOT ported — see
 * docs/architecture.md. The original already fell back to this same 2D canvas whenever
 * the Three.js CDN was unreachable, so this is a supported rendering of the hero, not a
 * degraded one, and it saves ~600 KB on a static site.
 */
export function NeuronCanvas({
  density = 75,
  className = "",
}: {
  /** Node count. The hero uses a denser field than the section backgrounds. */
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const LINK_DISTANCE = 150;
    const POINTER_DISTANCE = 110;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    const pointer = { x: -999, y: -999 };

    const nodes = Array.from({ length: density }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
    }));

    /*
     * Node positions are held as 0..1 fractions and scaled at draw time, so a resize
     * repositions them proportionally. Storing pixels (as the original did) meant every
     * node kept its old coordinates after a resize and they bunched into one corner.
     */
    let seeded = false;
    const positions = nodes.map((node) => ({ x: node.x, y: node.y }));

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2); // cap: 3x costs more than it shows
      width = parent!.offsetWidth;
      height = parent!.offsetHeight;
      canvas!.width = width * ratio;
      canvas!.height = height * ratio;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);

      if (!seeded) {
        positions.forEach((position, i) => {
          position.x = nodes[i]!.x * width;
          position.y = nodes[i]!.y * height;
        });
        seeded = true;
      }
    }

    function draw() {
      context!.clearRect(0, 0, width, height);

      for (let i = 0; i < positions.length; i++) {
        const node = positions[i]!;
        const velocity = nodes[i]!;

        if (!reduceMotion) {
          node.x += velocity.vx;
          node.y += velocity.vy;
          if (node.x < 0 || node.x > width) velocity.vx *= -1;
          if (node.y < 0 || node.y > height) velocity.vy *= -1;
        }

        // j starts at i+1: each pair is drawn once. The original did the same, and it is
        // what keeps this O(n²/2) loop affordable at 75 nodes.
        for (let j = i + 1; j < positions.length; j++) {
          const other = positions[j]!;
          const distance = Math.hypot(node.x - other.x, node.y - other.y);
          if (distance < LINK_DISTANCE) {
            context!.strokeStyle = `rgba(56,189,248,${(1 - distance / LINK_DISTANCE) * 0.22})`;
            context!.lineWidth = 0.6;
            context!.beginPath();
            context!.moveTo(node.x, node.y);
            context!.lineTo(other.x, other.y);
            context!.stroke();
          }
        }

        if (pointer.x > 0) {
          const distance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
          if (distance < POINTER_DISTANCE) {
            context!.strokeStyle = `rgba(56,189,248,${(1 - distance / POINTER_DISTANCE) * 0.5})`;
            context!.lineWidth = 0.9;
            context!.beginPath();
            context!.moveTo(node.x, node.y);
            context!.lineTo(pointer.x, pointer.y);
            context!.stroke();
          }
        }

        context!.beginPath();
        context!.arc(node.x, node.y, velocity.r, 0, Math.PI * 2);
        context!.fillStyle = "rgba(56,189,248,.65)";
        context!.fill();
      }

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = parent!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }

    function onPointerLeave() {
      pointer.x = -999;
      pointer.y = -999;
    }

    // ResizeObserver, not the window resize event: these canvases fill a section whose
    // height changes when its content loads, which no window event reports.
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    resize();
    draw();

    parent.addEventListener("pointermove", onPointerMove);
    parent.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      // Decorative. It carries no information, so it is hidden from assistive tech.
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-55 ${className}`}
    />
  );
}
