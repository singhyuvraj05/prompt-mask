# PRD: PromptMask — Pre-LLM Privacy Firewall & Data Masking Engine

## 1. Problem & Core Value
* **Problem:** Developers, healthcare workers, and enterprise staff frequently leak sensitive data (API keys, PII, financial details, medical records) into LLM prompts without realization.
* **Solution:** PromptMask is a real-time, zero-latency client-side firewall that intercepts prompt text, detects sensitive entities across 6 enterprise categories, calculates a 0–100 Risk Score, and replaces sensitive data with reversible surrogate mask tokens (e.g., `<PERSON_1>`, `<API_KEY_1>`).

## 2. Hero User Journey (Judging Demo Flow)
1. **Selection / Input:** User selects an enterprise preset ("FinTech Leak", "Healthcare EHR Note", "DevOps Config") or types directly into the raw input box.
2. **Inspection & Masking (Simulated 300ms Processing):**
   * Instant pattern recognition & entity tagging (Emails, Phones, Indian Aadhaar/PAN, API Keys, JWT Tokens, Credit Cards, Medical Terms).
   * Live Risk Meter update (0 = Safe, 100 = Critical Violation).
3. **Dual-Pane Output:**
   * **Left Pane (Vulnerability Inspector):** Highlights detected sensitive data in glowing danger badges.
   * **Right Pane (Sanitized LLM Payload):** Displays prompt with clean replacement tokens ready for external API calls, complete with a "Copy Masked Prompt" button.
4. **Policy Switchboard:** Interactive switches to toggle rule engines on/off (PII, Financial PCI-DSS, Secrets/Keys, HIPAA/Health).
5. **Audit Telemetry:** An interactive table logging historical prompt inspections, risk classifications, and masked token counts.

## 3. Scope Boundaries
* **In-Scope (Must Build):**
  * Modern, dark-mode cybersecurity dashboard with Tailwind CSS.
  * Fast local regex/heuristic pattern matching in `/lib/maskEngine.js`.
  * Real-time dual-pane comparison playground.
  * Interactive Risk Score Gauge component.
  * Policy toggles modifying active detection rules in state.
  * Pre-loaded presets in `/data/presets.json`.
  * Pre-populated historical audit trail in `/data/auditLogs.json`.
* **Strictly Out-of-Scope (DO NOT BUILD):**
  * Authentication, user login, or signup screens.
  * External cloud database connections (Supabase, Firebase, Prisma).
  * Heavy server-side Python NLP services.

## 4. Entity Schema & Data Structure
```typescript
interface DetectedEntity {
  id: string;
  type: 'PII' | 'SECRET' | 'FINANCIAL' | 'HEALTH';
  label: string;
  raw: string;
  token: string;
  startIndex: number;
  endIndex: number;
}

interface AuditRecord {
  id: string;
  timestamp: string;
  riskScore: number;
  status: 'Sanitized' | 'Blocked' | 'Safe';
  maskedCount: number;
  snippet: string;
}