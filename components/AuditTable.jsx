'use client';

import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, ShieldAlert, AlertTriangle, ArrowUpRight, History } from 'lucide-react';

export default function AuditTable({ logs = [], onLoadPrompt }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter logs based on search query and status filter
  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      statusFilter === 'All' ? true : log.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (log.categories && log.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Blocked
          </span>
        );
      case 'Sanitized':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Sanitized
          </span>
        );
      case 'Safe':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Safe
          </span>
        );
    }
  };

  const getRiskScoreBadge = (score) => {
    let colorClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40';
    if (score >= 70) {
      colorClass = 'text-rose-400 bg-rose-950/60 border-rose-800/40';
    } else if (score >= 30) {
      colorClass = 'text-amber-400 bg-amber-950/60 border-amber-800/40';
    }

    return (
      <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${colorClass}`}>
        {score}/100
      </span>
    );
  };

  // Helper to format ISO or relative timestamps
  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Intercepted Audit Telemetry
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                {filteredLogs.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit log of historical and active pre-LLM firewall interceptions.
            </p>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID, text, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none w-48 sm:w-56"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center p-0.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            {['All', 'Blocked', 'Sanitized', 'Safe'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Audit ID &amp; Time</th>
              <th className="py-3 px-4 min-w-[280px]">Intercepted Snippet</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Action Taken</th>
              <th className="py-3 px-4">Entities Blocked</th>
              <th className="py-3 px-4 text-right">Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                  No audit records match the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* ID & Timestamp */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-cyan-400 block">{log.id}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {formatTime(log.timestamp)}
                    </span>
                  </td>

                  {/* Snippet */}
                  <td className="py-3 px-4">
                    <p className="text-slate-200 line-clamp-1 max-w-md" title={log.snippet}>
                      {log.snippet}
                    </p>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getRiskScoreBadge(log.riskScore)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>

                  {/* Entities Blocked */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-200">
                        {log.maskedCount}
                      </span>
                      {log.categories &&
                        log.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase"
                          >
                            {cat}
                          </span>
                        ))}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onLoadPrompt && onLoadPrompt(log.snippet)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700/50 transition-colors cursor-pointer text-[11px]"
                    >
                      <span>Load</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
