import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function CyberBackground() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = Math.min(Math.floor((width * height) / 24000), 55);
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const speedMult = isDark ? 0.38 : 0.22;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speedMult,
        vy: (Math.random() - 0.5) * speedMult,
        radius: isDark ? Math.random() * 1.6 + 0.8 : Math.random() * 1.3 + 0.6,
        baseAlpha: isDark ? Math.random() * 0.5 + 0.2 : Math.random() * 0.35 + 0.15
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const nodeColor = isDark ? '0, 240, 255' : '14, 165, 233';
      const lineColor = isDark ? '0, 229, 255' : '56, 189, 248';

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + nodeColor + ", " + (n.baseAlpha * (isDark ? 0.75 : 0.35)) + ")";
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 125) {
            const alpha = (1 - dist / 125) * (isDark ? 0.14 : 0.05);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = "rgba(" + lineColor + ", " + alpha + ")";
            ctx.lineWidth = isDark ? 0.75 : 0.5;
            ctx.stroke();
          }
        }

        const mdx = n.x - mouseX;
        const mdy = n.y - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 130) {
          const mAlpha = (1 - mdist / 130) * (isDark ? 0.32 : 0.12);
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = "rgba(" + nodeColor + ", " + mAlpha + ")";
          ctx.lineWidth = isDark ? 1 : 0.75;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: isDark ? 0.75 : 0.35
      }}
    />
  );
}
