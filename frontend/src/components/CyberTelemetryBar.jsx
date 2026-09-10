import React, { useState, useEffect } from 'react';
import { Shield, Radio, Cpu, Lock, Terminal, Activity, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CyberTelemetryBar() {
  const { isDark } = useTheme();
  const [timeStr, setTimeStr] = useState('');
  const [activeNode, setActiveNode] = useState('SEC-ALPHA-01');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
      const utcTime = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false });
      setTimeStr(`IST ${istTime} | UTC ${utcTime}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-telemetry-bar">
      <div className="telemetry-left">
        <div className="telemetry-item highlight">
          <span className="telemetry-pulse-dot" />
          <span className="telemetry-label">DEFCON 4</span>
          <span className="telemetry-val">NORMAL CYBER POSTURE</span>
        </div>

        <div className="telemetry-divider" />

        <div className="telemetry-item">
          <Terminal size={12} className="telemetry-icon" />
          <span className="telemetry-label">NODE:</span>
          <span className="telemetry-val mono">BISAG-N/{activeNode}</span>
        </div>

        <div className="telemetry-divider" />

        <div className="telemetry-item hide-mobile">
          <Lock size={12} className="telemetry-icon" />
          <span className="telemetry-label">CIPHER:</span>
          <span className="telemetry-val mono">AES-256-GCM</span>
        </div>
      </div>

      <div className="telemetry-right">
        <div className="telemetry-item hide-tablet">
          <Shield size={12} className="telemetry-icon" />
          <span className="telemetry-val">OWASP 2025 COMPLIANT</span>
        </div>

        <div className="telemetry-divider hide-tablet" />

        <div className="telemetry-item clock-item">
          <Activity size={12} className="telemetry-icon text-cyan" />
          <span className="telemetry-clock mono">{timeStr || 'SEC CLOCK SYNC...'}</span>
        </div>
      </div>
    </div>
  );
}
