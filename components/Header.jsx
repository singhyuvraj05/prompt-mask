'use client';

import React from 'react';
import { Shield, Zap, Lock, Terminal, Activity } from 'lucide-react';

export default function Header({ latency = '< 4ms', totalInspections = 8 }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 animate-pulse pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                Prompt<span className="text-cyan-400">Mask</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 uppercase tracking-wider">
                v1.0.0-hackathon
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pre-LLM Client-Side Privacy Firewall &amp; Surrogate Tokenizer
            </p>
          </div>
        </div>

        {/* Live Status & Telemetry Metrics */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          
          {/* Active Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold uppercase tracking-wide">Firewall Active</span>
          </div>

          {/* Latency Metric */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Latency:</span>
            <span className="font-semibold text-amber-300">{latency}</span>
          </div>

          {/* Mode Metric */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono hidden sm:flex">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Mode:</span>
            <span className="font-semibold text-cyan-300">Zero-Knowledge</span>
          </div>

          {/* Inspections Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono hidden md:flex">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Telemetry:</span>
            <span className="font-semibold text-indigo-300">{totalInspections} logs</span>
          </div>

        </div>

      </div>
    </header>
  );
}
