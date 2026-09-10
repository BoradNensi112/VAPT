import React, { useEffect, useRef } from 'react';
import { Shield, Lock, Activity, Radio, Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HolographicShield({ score = 84, grade = 'A', assets = 64, threatLevel = 'ELEVATED' }) {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;
    let particles = [];

    // Create 32 ambient floating particles
    for (let i = 0; i < 32; i++) {
      particles.push({
        x: Math.random() * 260,
        y: Math.random() * 260,
        radius: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, 260, 260);

      const centerX = 130;
      const centerY = 130;
      const primaryCyan = isDark ? 'rgba(59, 130, 246,' : 'rgba(37, 99, 235,';
      const greenAccent = isDark ? 'rgba(16, 185, 129,' : 'rgba(5, 150, 105,';

      // Draw subtle background grid
      ctx.strokeStyle = `${primaryCyan} 0.05)`;
      ctx.lineWidth = 1;
      for (let x = 20; x < 260; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 260);
        ctx.stroke();
      }
      for (let y = 20; y < 260; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(260, y);
        ctx.stroke();
      }

      // Draw floating cyber particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = 260;
        if (p.x > 260) p.x = 0;
        if (p.y < 0) p.y = 260;
        if (p.y > 260) p.y = 0;

        ctx.fillStyle = `${primaryCyan} ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Outer Holographic Concentric Rings
      ctx.save();
      ctx.strokeStyle = `${primaryCyan} 0.25)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 114, angle * 0.5, angle * 0.5 + Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = `${greenAccent} 0.35)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, -angle, -angle + Math.PI * 1.2);
      ctx.stroke();
      ctx.restore();

      // Radar Sweep Effect
      ctx.save();
      const sweepGradient = ctx.createConicGradient(angle, centerX, centerY);
      sweepGradient.addColorStop(0, `${primaryCyan} 0.18)`);
      sweepGradient.addColorStop(0.12, `${primaryCyan} 0.0)`);
      sweepGradient.addColorStop(1, `${primaryCyan} 0.0)`);
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 96, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner Pulse Ring
      const pulseSize = 84 + Math.sin(angle * 3) * 2.5;
      ctx.save();
      ctx.strokeStyle = `${primaryCyan} 0.35)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      angle += 0.015;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div className="hologram-shield-wrapper">
      <div className="hologram-canvas-container">
        <canvas ref={canvasRef} width={260} height={260} className="hologram-canvas" />

        {/* Center Shield Core */}
        <div className="shield-core-content">
          <div className="shield-glow-icon">
            <Shield size={32} color="#3b82f6" />
            <span className="shield-inner-lock">
              <Lock size={14} color="#10b981" />
            </span>
          </div>

          <div className="shield-score-number">{score}<span>%</span></div>
          <div className="shield-grade-badge">GRADE {grade}</div>
          <div className="shield-status-ping">
            <span className="live-ping-dot" />
            <span>HARDENED</span>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="shield-telemetry-grid">
        <div className="shield-telemetry-item">
          <div className="telemetry-label">THREAT LEVEL</div>
          <div className="telemetry-val threat-elevated">
            <Radio size={13} color="#ef4444" />
            <span>{threatLevel}</span>
          </div>
        </div>

        <div className="shield-telemetry-item">
          <div className="telemetry-label">PROTECTED ASSETS</div>
          <div className="telemetry-val">
            <Cpu size={13} color="#3b82f6" />
            <span>{assets} Targets</span>
          </div>
        </div>

        <div className="shield-telemetry-item">
          <div className="telemetry-label">SYSTEM UPTIME</div>
          <div className="telemetry-val success">
            <Activity size={13} color="#10b981" />
            <span>99.98%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
