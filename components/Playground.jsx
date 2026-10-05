'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  KeyRound,
  FileCode,
  Eye,
  EyeOff,
  Send,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import RehydrationModal from '@/components/RehydrationModal';

export default function Playground({
  presets = [],
  selectedPresetId = '',
  onSelectPreset,
  promptText = '',
  onChangePrompt,
  maskResult,
  onRunFirewall,
}) {
  const [copied, setCopied] = useState(false);
  const [showTokenMap, setShowTokenMap] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [noTokensToast, setNoTokensToast] = useState(false);

  const entities = maskResult?.entities || [];
  const maskedText = maskResult?.maskedText || '';
  const tokenMap = maskResult?.tokenMap || {};

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(maskedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleSimulateCall = () => {
    if (!entities || entities.length === 0) {
      setNoTokensToast(true);
      setTimeout(() => setNoTokensToast(false), 3000);
      return;
    }
    setModalOpen(true);
  };

  // Helper to render masked text with glowing token chips
  const renderMaskedContent = (text) => {
    if (!text) return <span className="text-slate-500 italic">No prompt entered yet.</span>;

    // Split text by tokens like <AWS_KEY_1>, <EMAIL_1>, etc.
    const tokenRegex = /(<[A-Z0-9_]+>)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (tokenRegex.test(part)) {
        // Reset regex state
        tokenRegex.lastIndex = 0;
        const rawValue = tokenMap[part];

        // Color coding based on token type
        let tokenColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]';
        if (part.includes('CREDIT') || part.includes('AMOUNT')) {
          tokenColor = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
        } else if (part.includes('DIAGNOSIS') || part.includes('MEDICATION') || part.includes('PROCEDURE')) {
          tokenColor = 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.2)]';
        } else if (part.includes('EMAIL') || part.includes('PHONE') || part.includes('AADHAAR') || part.includes('PAN')) {
          tokenColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
        }

        return (
          <span
            key={index}
            title={rawValue ? `Original: ${rawValue}` : 'Masked Token'}
            className={`inline-flex items-center px-2 py-0.5 mx-1 rounded font-mono text-xs font-bold border transition-all duration-150 cursor-help ${tokenColor}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Preset Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Load Enterprise Preset:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* ============================================================== */}
        {/* LEFT PANE: Vulnerability Inspector (Raw Input) */}
        {/* ============================================================== */}
        <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Raw Input (Vulnerability Inspector)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                {promptText.length} chars | {promptText.trim() ? promptText.trim().split(/\s+/).length : 0} words
              </span>
            </div>
          </div>

          {/* Text Area */}
          <div className="p-4 flex-1 flex flex-col min-h-[300px]">
            <textarea
              value={promptText}
              onChange={(e) => onChangePrompt(e.target.value)}
              placeholder="Paste raw prompt, credentials, customer data, or clinical handover note here to test the firewall..."
              className="w-full flex-1 p-3.5 bg-slate-950/80 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none font-mono text-xs leading-relaxed resize-none transition-all"
              rows={12}
            />

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 mt-2 border-t border-slate-800/80">
              <button
                onClick={() => onChangePrompt('')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>

              <button
                onClick={onRunFirewall}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-semibold shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-2 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-200" />
                Run Firewall &amp; Log
              </button>
            </div>
          </div>

          {/* Detected Vulnerabilities List Drawer */}
          {entities.length > 0 && (
            <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400 block mb-2">
                Flagged Sensitive Spans ({entities.length}):
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {entities.map((ent) => (
                  <div
                    key={ent.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400 font-semibold">{ent.label}:</span>
                      <span className="text-rose-400 truncate max-w-[200px]" title={ent.raw}>
                        &quot;{ent.raw}&quot;
                      </span>
                    </div>
                    <span className="text-cyan-400 font-bold shrink-0">{ent.token}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANE: Sanitized LLM Payload */}
        {/* ============================================================== */}
        <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Sanitized Payload (Safe for LLM)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Masked</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sanitized Content Area */}
          <div className="p-4 flex-1 flex flex-col min-h-[300px]">
            <div className="w-full flex-1 p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed text-slate-200 overflow-y-auto whitespace-pre-wrap select-text">
              {renderMaskedContent(maskedText)}
            </div>

            {/* Simulated Transmission Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 mt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowTokenMap(!showTokenMap)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                {showTokenMap ? 'Hide Token Matrix' : 'Inspect Token Matrix'}
                {showTokenMap ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                onClick={handleSimulateCall}
                className="px-4 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-mono font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-100" />
                Simulate LLM Call
              </button>
            </div>

            {/* Simulation feedback toast */}
            {noTokensToast && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>No sensitive tokens detected to simulate.</span>
        </div>
      )}

      <RehydrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maskedText={maskedText}
        tokenMap={tokenMap}
      />
          </div>

          {/* Reversible Token Matrix Drawer */}
          {showTokenMap && (
            <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Reversibility Matrix (Local Browser Memory Only)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {Object.keys(tokenMap).length} tokens mapped
                </span>
              </div>

              {Object.keys(tokenMap).length === 0 ? (
                <p className="text-xs font-mono text-slate-500 italic py-2">
                  No surrogate tokens active for this prompt.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {Object.entries(tokenMap).map(([token, raw]) => (
                    <div
                      key={token}
                      className="flex items-center justify-between gap-3 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
                    >
                      <span className="text-cyan-300 font-bold shrink-0">{token}</span>
                      <span className="text-slate-500">⟷</span>
                      <span className="text-amber-300 truncate max-w-[240px] text-right" title={raw}>
                        {raw}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
