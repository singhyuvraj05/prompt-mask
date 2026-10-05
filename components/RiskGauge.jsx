'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, KeyRound, User, CreditCard, HeartPulse } from 'lucide-react';

export default function RiskGauge({ riskScore = 0, riskLevel = 'Safe', entities = [] }) {
  // Categorize detected entities
  const categoryCounts = entities.reduce((acc, ent) => {
    const policy = ent.policy || 'other';
    acc[policy] = (acc[policy] || 0) + 1;
    return acc;
  }, {});

  // Determine styling based on risk score
  let theme = {
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    gaugeColor: '#10b981', // emerald-500
    glowColor: 'rgba(16, 185, 129, 0.25)',
    textColor: 'text-emerald-400',
    title: 'Zero Threat Detected',
    desc: 'Prompt is clean. Safe for direct transmission to LLM providers.',
    icon: ShieldCheck,
  };

  if (riskScore >= 70 || riskLevel === 'Critical') {
    theme = {
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      gaugeColor: '#f43f5e', // rose-500
      glowColor: 'rgba(244, 63, 94, 0.3)',
      textColor: 'text-rose-400',
      title: 'Critical Threat Level',
      desc: 'High-severity credentials or sensitive identifiers intercepted. Direct prompt transmission prohibited.',
      icon: ShieldAlert,
    };
  } else if (riskScore > 0 || riskLevel === 'Warning') {
    theme = {
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      gaugeColor: '#f59e0b', // amber-500
      glowColor: 'rgba(245, 158, 11, 0.25)',
      textColor: 'text-amber-400',
      title: 'Moderate Exposure',
      desc: 'Sensitive identifiers detected. Reversible surrogate tokens applied before transmission.',
      icon: AlertTriangle,
    };
  }

  const StatusIcon = theme.icon;

  // Arc math for 180-degree semi-circle gauge
  const radius = 68;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // 180-degree arc length
  const progressOffset = circumference - (Math.min(100, Math.max(0, riskScore)) / 100) * circumference;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span>Risk Telemetry &amp; Vulnerability Gauge</span>
        </h3>
        <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5 ${theme.badgeBg}`}>
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: theme.gaugeColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: theme.gaugeColor }}
            />
          </span>
          <span>{riskLevel.toUpperCase()} RISK</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Semi-circular Speedometer SVG Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
          <div className="relative w-44 h-26 flex items-end justify-center">
            <svg viewBox="0 0 160 95" className="w-44 h-26 overflow-visible">
              {/* Background Arc */}
              <path
                d="M 12 85 A 68 68 0 0 1 148 85"
                fill="none"
                stroke="#1e293b"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Animated Progress Arc */}
              <path
                d="M 12 85 A 68 68 0 0 1 148 85"
                fill="none"
                stroke={theme.gaugeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{ filter: `drop-shadow(0 0 8px ${theme.glowColor})` }}
              />
            </svg>

            {/* Numerical Score Display */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center text-center">
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${theme.textColor}`}>
                {riskScore}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          <div className="flex justify-between w-40 text-[10px] font-mono text-slate-400 px-1 mt-1">
            <span>0 SAFE</span>
            <span>50 WARN</span>
            <span>100 CRIT</span>
          </div>
        </div>

        {/* Diagnosis & Threat Breakdown */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800/80 text-slate-200 shrink-0 mt-0.5">
              <StatusIcon className={`w-5 h-5 ${theme.textColor}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 font-mono">{theme.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{theme.desc}</p>
            </div>
          </div>

          {/* Detected Entity Chips */}
          <div className="pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-mono text-slate-400 block mb-2">
              Detected Interceptions ({entities.length} total):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {entities.length === 0 ? (
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                  ✓ 0 Sensitive Entities Found
                </span>
              ) : (
                <>
                  {categoryCounts.secrets ? (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 flex items-center gap-1.5 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                      <KeyRound className="w-3 h-3 text-cyan-400" />
                      {categoryCounts.secrets} {categoryCounts.secrets === 1 ? 'Secret' : 'Secrets'}
                    </span>
                  ) : null}

                  {categoryCounts.financial ? (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/50 flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
                      <CreditCard className="w-3 h-3 text-amber-400" />
                      {categoryCounts.financial} Financial
                    </span>
                  ) : null}

                  {categoryCounts.pii ? (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                      <User className="w-3 h-3 text-emerald-400" />
                      {categoryCounts.pii} PII
                    </span>
                  ) : null}

                  {categoryCounts.health ? (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/50 flex items-center gap-1.5 shadow-[0_0_8px_rgba(244,63,94,0.1)]">
                      <HeartPulse className="w-3 h-3 text-rose-400" />
                      {categoryCounts.health} Health (HIPAA)
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
