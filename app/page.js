'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PolicyBar from '@/components/PolicyBar';
import RiskGauge from '@/components/RiskGauge';
import Playground from '@/components/Playground';
import AuditTable from '@/components/AuditTable';
import { inspectAndMask } from '@/lib/maskEngine';
import presetsData from '@/data/presets.json';
import initialLogs from '@/data/auditLogs.json';

export default function Home() {
  const [policies, setPolicies] = useState({
    pii: true,
    secrets: true,
    financial: true,
    health: true,
  });

  const [selectedPresetId, setSelectedPresetId] = useState(
    presetsData[0]?.id || 'devops-leak'
  );
  const [promptText, setPromptText] = useState(
    presetsData[0]?.prompt || ''
  );

  const [maskResult, setMaskResult] = useState(() =>
    inspectAndMask(presetsData[0]?.prompt || '', {
      pii: true,
      secrets: true,
      financial: true,
      health: true,
    })
  );

  const [auditLogs, setAuditLogs] = useState(initialLogs);
  const [latency, setLatency] = useState(1.2);

  const runFirewall = (text = promptText, currentPolicies = policies) => {
    const start = performance.now();
    const result = inspectAndMask(text, currentPolicies);
    const duration = Math.max(0.4, Number((performance.now() - start).toFixed(2)));
    setLatency(duration);
    setMaskResult(result);
    return { result, duration };
  };

  useEffect(() => {
    runFirewall(promptText, policies);
  }, [policies]);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setPromptText(preset.prompt);
    runFirewall(preset.prompt, policies);
  };

  const handleRunFirewallAndLog = () => {
    const { result, duration } = runFirewall(promptText, policies);
    const score = result?.riskScore ?? 0;
    const newLog = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      promptPreview: promptText.slice(0, 65) + (promptText.length > 65 ? '...' : ''),
      score,
      status: score > 70 ? 'Blocked' : score > 0 ? 'Sanitized' : 'Safe',
      threats: result?.flaggedEntities?.length ?? 0,
      latency: `${duration}ms`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const togglePolicy = (key) => {
    setPolicies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllPolicies = (val) => {
    setPolicies({
      pii: val,
      secrets: val,
      financial: val,
      health: val,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header latency={latency} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <PolicyBar
          policies={policies}
          activePolicies={policies}
          onTogglePolicy={togglePolicy}
          onToggleAll={toggleAllPolicies}
        />

        <RiskGauge
          riskScore={maskResult?.riskScore ?? 0}
          score={maskResult?.riskScore ?? 0}
          threatLevel={maskResult?.threatLevel}
          breakdown={maskResult?.breakdown}
          flaggedCount={maskResult?.flaggedEntities?.length ?? 0}
        />

        <Playground
          presets={presetsData}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          promptText={promptText}
          prompt={promptText}
          setPromptText={setPromptText}
          onChangePrompt={(val) => {
            setPromptText(val);
            runFirewall(val, policies);
          }}
          maskResult={maskResult}
          onRunFirewall={handleRunFirewallAndLog}
        />

        <AuditTable
          logs={auditLogs}
          onLoadPreset={(logPrompt) => {
            if (logPrompt) {
              setPromptText(logPrompt);
              runFirewall(logPrompt, policies);
            }
          }}
        />
      </main>
    </div>
  );
}