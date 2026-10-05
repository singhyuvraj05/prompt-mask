'use client';

import React from 'react';
import { KeyRound, ShieldAlert, CreditCard, HeartPulse, SlidersHorizontal, Check } from 'lucide-react';

export default function PolicyBar({ activePolicies, onTogglePolicy, onToggleAll }) {
  const policiesConfig = [
    {
      key: 'secrets',
      label: 'Secrets & Keys',
      sublabel: 'AWS Keys, JWTs, Passwords, IPs',
      icon: KeyRound,
      color: 'cyan',
      activeBorder: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      toggleBg: 'bg-cyan-500',
      badge: 'Critical Rule',
    },
    {
      key: 'financial',
      label: 'Financial (PCI-DSS)',
      sublabel: 'Credit Cards, Bank Balances, Amounts',
      icon: CreditCard,
      color: 'amber',
      activeBorder: 'border-amber-500/50 bg-amber-950/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      toggleBg: 'bg-amber-500',
      badge: 'PCI Compliance',
    },
    {
      key: 'pii',
      label: 'PII Guardian',
      sublabel: 'Emails, Phones, Aadhaar, PAN',
      icon: ShieldAlert,
      color: 'emerald',
      activeBorder: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      toggleBg: 'bg-emerald-500',
      badge: 'GDPR / DPDP',
    },
    {
      key: 'health',
      label: 'Health & HIPAA',
      sublabel: 'Diagnoses, Prescriptions, Biopsies',
      icon: HeartPulse,
      color: 'rose',
      activeBorder: 'border-rose-500/50 bg-rose-950/40 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
      toggleBg: 'bg-rose-500',
      badge: 'HIPAA Shield',
    },
  ];

  const totalActive = Object.values(activePolicies).filter(Boolean).length;
  const allActive = totalActive === policiesConfig.length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Firewall Policy Switchboard
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                {totalActive}/{policiesConfig.length} Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Toggle real-time detection filters. Changes apply instantly to active prompt evaluations.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleAll}
          className="self-start sm:self-center text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {allActive ? 'Disable All Policies' : 'Enable All Policies'}
        </button>
      </div>

      {/* 4 Interactive Policy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {policiesConfig.map((policy) => {
          const isActive = !!activePolicies[policy.key];
          const IconComponent = policy.icon;

          return (
            <div
              key={policy.key}
              onClick={() => onTogglePolicy(policy.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTogglePolicy(policy.key);
                }
              }}
              className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? policy.activeBorder
                  : 'border-slate-800/80 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-slate-900/80 text-white' : 'bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono tracking-tight text-slate-200">
                      {policy.label}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {policy.badge}
                    </span>
                  </div>
                </div>

                {/* Custom Switch Pill */}
                <div
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                    isActive ? policy.toggleBg : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  >
                    {isActive && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                {policy.sublabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
