import React from 'react';

export default function ThreatCore3D({ score = 85, criticalCount = 0 }) {
  let grade = 'A';
  let gradeColor = '#10b981';
  let statusText = 'SECURE POSTURE';

  if (score < 40 || criticalCount > 2) {
    grade = 'F';
    gradeColor = '#ef4444';
    statusText = 'CRITICAL THREAT LEVEL';
  } else if (score < 60) {
    grade = 'C';
    gradeColor = '#f97316';
    statusText = 'ELEVATED RISK';
  } else if (score < 80) {
    grade = 'B';
    gradeColor = '#eab308';
    statusText = 'MODERATE POSTURE';
  }

  return (
    <div style={{
      position: 'relative',
      width: '240px',
      height: '240px',
      margin: '0 auto 20px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Outer Pulse Ring */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: `2px dashed ${gradeColor}`,
        opacity: 0.4,
        animation: 'spin 20s linear infinite'
      }} />

      {/* Secondary Glow Ring */}
      <div style={{
        position: 'absolute',
        width: '80%',
        height: '80%',
        borderRadius: '50%',
        border: `2px solid ${gradeColor}`,
        boxShadow: `0 0 25px ${gradeColor}44`,
        opacity: 0.8
      }} />

      {/* Core Display */}
      <div style={{
        textAlign: 'center',
        zIndex: 2
      }}>
        <div style={{
          fontSize: '48px',
          fontFamily: 'var(--font-cyber)',
          fontWeight: 800,
          color: gradeColor,
          lineHeight: 1,
          textShadow: `0 0 20px ${gradeColor}`
        }}>
          {grade}
        </div>
        <div style={{
          fontSize: '13px',
          fontFamily: 'var(--font-cyber)',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '1px',
          marginTop: '6px'
        }}>
          {score}/100
        </div>
        <div style={{
          fontSize: '10px',
          color: gradeColor,
          fontFamily: 'var(--font-cyber)',
          letterSpacing: '1.2px',
          marginTop: '2px'
        }}>
          {statusText}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
