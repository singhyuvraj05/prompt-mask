'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Copy, Check, Shield, Zap, Lock, ArrowRight } from 'lucide-react';
import { unmaskText } from '@/lib/maskEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a realistic mock LLM response that references every surrogate token
 * found in the masked text, so Step 2 feels contextually believable.
 */
function buildMockLLMResponse(maskedText, tokenMap) {
  if (!maskedText) return '';

  const tokens = Object.keys(tokenMap);
  if (tokens.length === 0) {
    return 'I have reviewed your configuration. Everything looks good — no sensitive parameters were referenced in this request.';
  }

  // Derive what kind of tokens we have to build a themed response
  const hasIP = tokens.some((t) => t.startsWith('<INTERNAL_IP'));
  const hasPassword = tokens.some((t) => t.startsWith('<PASSWORD'));
  const hasEmail = tokens.some((t) => t.startsWith('<EMAIL'));
  const hasCC = tokens.some((t) => t.startsWith('<CREDIT_CARD'));
  const hasAWS = tokens.some((t) => t.startsWith('<AWS_KEY') || t.startsWith('<AWS_SECRET'));
  const hasJWT = tokens.some((t) => t.startsWith('<JWT') || t.startsWith('<BEARER'));
  const hasHealth = tokens.some(
    (t) => t.startsWith('<DIAGNOSIS') || t.startsWith('<MEDICATION') || t.startsWith('<PROCEDURE'),
  );
  const hasPAN = tokens.some((t) => t.startsWith('<PAN') || t.startsWith('<AADHAAR'));
  const hasPhone = tokens.some((t) => t.startsWith('<PHONE'));

  // Build sentence fragments referencing the actual tokens
  const refs = tokens.slice(0, 6).join(', ');

  let theme = 'configuration update';
  let body = '';

  if (hasAWS || hasJWT) {
    theme = 'credential rotation';
    body = `Authentication audit complete. The credentials referenced as ${refs} have been validated against our IAM policy engine. `;
    body += `The access key ${tokens.find((t) => t.startsWith('<AWS_KEY')) ?? tokens[0]} shows standard permissions. `;
    if (tokens.find((t) => t.startsWith('<AWS_SECRET'))) {
      body += `The associated secret ${tokens.find((t) => t.startsWith('<AWS_SECRET'))} should be rotated within the next 90-day window per NIST SP 800-63B guidelines.`;
    }
  } else if (hasIP || hasPassword) {
    theme = 'infrastructure provisioning';
    body = `Infrastructure provisioning acknowledged. `;
    if (hasIP) {
      const ipToken = tokens.find((t) => t.startsWith('<INTERNAL_IP')) ?? tokens[0];
      body += `Host bound to ${ipToken} — ensure firewall ingress rules allow only port 443/TLS. `;
    }
    if (hasPassword) {
      const pwToken = tokens.find((t) => t.startsWith('<PASSWORD')) ?? tokens[0];
      body += `Authentication credential ${pwToken} has been registered in the secrets vault. `;
    }
    body += `Configuration updated successfully with the parameters supplied.`;
  } else if (hasHealth) {
    theme = 'clinical data processing';
    body = `Clinical record processed. The diagnostic and treatment data (${refs}) has been encrypted at rest per HIPAA §164.312(a)(2)(iv). `;
    body += `Recommend scheduling a 30-day follow-up review for the conditions noted.`;
  } else if (hasCC) {
    theme = 'payment processing';
    const ccToken = tokens.find((t) => t.startsWith('<CREDIT_CARD')) ?? tokens[0];
    body = `Payment record indexed under surrogate reference ${ccToken}. `;
    body += `PCI-DSS tokenization confirmed — primary account number never traversed the network boundary. Transaction approved.`;
  } else if (hasEmail || hasPhone || hasPAN) {
    theme = 'identity verification';
    body = `Identity document review complete. The personal identifiers (${refs}) have been matched against our KYC datastore. `;
    body += `All records conform to GDPR Article 25 data-minimisation requirements.`;
  } else {
    body = `I have processed your request referencing the parameters: ${refs}. All operations completed successfully with the provided context. Please verify the output against your compliance checklist before proceeding.`;
  }

  return (
    `[Mock LLM Response — ${theme.toUpperCase()} CONTEXT]\n\n` +
    body +
    `\n\n` +
    `Note: This response was generated with zero exposure of plaintext secrets. All values above are surrogate tokens maintained exclusively in browser memory.`
  );
}

// ---------------------------------------------------------------------------
// Step Badge
// ---------------------------------------------------------------------------

function StepBadge({ label, color }) {
  const colorMap = {
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${colorMap[color] ?? colorMap.green}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Step Card
// ---------------------------------------------------------------------------

function StepCard({ stepNumber, title, badge, badgeColor, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Step header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-[11px] font-bold font-mono text-slate-300">
            {stepNumber}
          </span>
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <StepBadge label={badge} color={badgeColor} />
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export default function RehydrationModal({ isOpen, onClose, maskedText, tokenMap }) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef(null);

  // Derived values
  const mockLLMResponse = isOpen ? buildMockLLMResponse(maskedText, tokenMap ?? {}) : '';
  const rehydratedText = isOpen ? unmaskText(mockLLMResponse, tokenMap ?? {}) : '';

  // ESC key handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Reset copy state when modal opens
  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rehydratedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable in some contexts — silent fail
    }
  };

  // Click outside to close
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Bidirectional Surrogate Rehydration"
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Modal header                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/70 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 tracking-tight">
                Bidirectional Surrogate Rehydration
              </h2>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Full roundtrip pipeline — outbound sanitization → LLM response → local decryption
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Scrollable body                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ============================================================== */}
          {/* STEP 1 — Outbound Egress Payload                               */}
          {/* ============================================================== */}
          <StepCard
            stepNumber="1"
            title="Outbound Egress Payload"
            badge="Zero Secrets Transmitted"
            badgeColor="green"
            icon={Shield}
          >
            <div className="rounded-xl border border-emerald-900/60 bg-slate-950/80 p-4">
              <p className="text-[11px] font-mono text-slate-400 mb-3">
                What leaves the trust boundary — sanitized text with surrogate tokens replacing all
                sensitive spans:
              </p>
              <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed break-words">
                {maskedText || '(empty payload)'}
              </pre>
              {tokenMap && Object.keys(tokenMap).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                  {Object.keys(tokenMap).map((token) => (
                    <span
                      key={token}
                      className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </StepCard>

          {/* Arrow connector */}
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />
          </div>

          {/* ============================================================== */}
          {/* STEP 2 — External LLM Response                                 */}
          {/* ============================================================== */}
          <StepCard
            stepNumber="2"
            title="External LLM Response"
            badge="Surrogate Context Preserved"
            badgeColor="purple"
            icon={Zap}
          >
            <div className="rounded-xl border border-purple-900/50 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/50 text-[10px] font-mono text-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
                  Mock Claude / OpenAI — Inferred Response
                </div>
              </div>
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed break-words">
                {mockLLMResponse}
              </pre>
            </div>
          </StepCard>

          {/* Arrow connector */}
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />
          </div>

          {/* ============================================================== */}
          {/* STEP 3 — Local Client Rehydration                              */}
          {/* ============================================================== */}
          <StepCard
            stepNumber="3"
            title="Local Client Rehydration"
            badge="Decrypted Client-Side (<0.1ms)"
            badgeColor="cyan"
            icon={Lock}
          >
            <div className="rounded-xl border border-cyan-900/50 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/50 text-[10px] font-mono text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                  <code>unmaskText(response, tokenMap)</code>
                  <span className="text-cyan-500">— Browser Memory Only</span>
                </div>
              </div>
              <pre className="text-xs font-mono text-cyan-100 whitespace-pre-wrap leading-relaxed break-words">
                {rehydratedText}
              </pre>
              {tokenMap && Object.keys(tokenMap).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-[11px] font-mono text-slate-500 mb-2">
                    Tokens restored to original values:
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {Object.entries(tokenMap).map(([token, raw]) => (
                      <div
                        key={token}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono"
                      >
                        <span className="text-cyan-400 font-bold shrink-0">{token}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-amber-300 truncate" title={raw}>
                          {raw}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </StepCard>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Modal footer                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-950/70 border-t border-slate-800 shrink-0">
          <p className="text-[11px] font-mono text-slate-500">
            All decryption occurs exclusively in browser memory — no plaintext secrets traverse the
            network.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-600/40 hover:border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Rehydrated Response
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

