/**
 * PromptMask – End-to-End Verification & Benchmark Script
 * =========================================================
 * Run: node scripts/test-e2e.mjs
 *
 * Covers:
 *  1. DevOps vectors    – AWS Key, AWS Secret, Internal IP, DB Password, Bearer token
 *  2. Financial vectors – 16-digit Card, CVV/PIN/OTP false-positive guard, Currency
 *  3. PII & HIPAA       – Email, Phone, PAN, Aadhaar, Medical diagnosis/medication
 *  4. Safe baseline     – React/TS snippet → score === 0, 0 false positives
 *  5. Reversibility     – unmaskText(maskedText, tokenMap) === originalText
 *  6. Latency benchmark – 1,000 iterations over mixed payload, assert avg < 1.0 ms
 */

// ─── Dynamic import (requirement) ────────────────────────────────────────────
const { inspectAndMask, unmaskText } = await import('../lib/maskEngine.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PASS = '✔';
const FAIL = '✘';

let totalTests  = 0;
let totalPassed = 0;
const failures  = [];

function assert(condition, label, extra = '') {
  totalTests++;
  if (condition) {
    totalPassed++;
    console.log(`  ${PASS} ${label}`);
  } else {
    failures.push(label + (extra ? ` — ${extra}` : ''));
    console.log(`  ${FAIL} ${label}${extra ? `  ← ${extra}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

/** Assert a specific tokenPrefix appears among detected entities. */
function assertDetected(entities, tokenPrefix, label) {
  const found = entities.some((e) => e.tokenPrefix === tokenPrefix);
  assert(
    found,
    `${label} detected (${tokenPrefix})`,
    found ? '' : `no entity with tokenPrefix="${tokenPrefix}" in [${entities.map((e) => e.tokenPrefix).join(', ')}]`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEVOPS VECTORS
// ─────────────────────────────────────────────────────────────────────────────
section('1/6  DevOps Secrets');

const devopsPayload = `
Deploy config:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
DB_PASSWORD="hunter2secret!"
Server address: 10.0.1.42
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
`.trim();

const devopsResult = inspectAndMask(devopsPayload);

assertDetected(devopsResult.entities, 'AWS_KEY',      'AWS Access Key');
assertDetected(devopsResult.entities, 'AWS_SECRET',   'AWS Secret Key');
assertDetected(devopsResult.entities, 'PASSWORD',     'DB Password');
assertDetected(devopsResult.entities, 'INTERNAL_IP',  'Internal IP (10.x)');
assertDetected(devopsResult.entities, 'BEARER_TOKEN', 'Bearer Token');
assert(
  devopsResult.riskScore > 0,
  `DevOps risk score > 0`,
  `got ${devopsResult.riskScore}`
);
assert(
  devopsResult.riskLevel !== 'Safe',
  `DevOps risk level is not Safe`,
  `got "${devopsResult.riskLevel}"`
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. FINANCIAL VECTORS
// ─────────────────────────────────────────────────────────────────────────────
section('2/6  Financial (PCI-DSS)');

const financialPayload = `
Customer payment details:
Card: 4111 1111 1111 1111
Card 2: 5500-0000-0000-0004
Transaction amount: $1,250.00
Also charge \u20b94999 and 75.00 USD
`.trim();

const financialResult = inspectAndMask(financialPayload);

assertDetected(financialResult.entities, 'CREDIT_CARD', '16-digit Visa card');
assert(
  financialResult.entities.filter((e) => e.tokenPrefix === 'CREDIT_CARD').length >= 2,
  'Two distinct credit card numbers detected',
  `found ${financialResult.entities.filter((e) => e.tokenPrefix === 'CREDIT_CARD').length}`
);
assertDetected(financialResult.entities, 'AMOUNT', 'Currency amount ($)');
assert(
  financialResult.entities.filter((e) => e.tokenPrefix === 'AMOUNT').length >= 2,
  'Multiple currency amounts detected',
  `found ${financialResult.entities.filter((e) => e.tokenPrefix === 'AMOUNT').length}`
);

// CVV / ATM PIN / OTP — standalone short digits must NOT trigger false positives
const cvvPayload = `CVV: 123   PIN: 4567   OTP: 982341`;
const cvvResult  = inspectAndMask(cvvPayload);
assert(
  cvvResult.entities.length === 0,
  'No false positives on standalone CVV / ATM PIN / OTP digits',
  `got ${cvvResult.entities.length} entities: [${cvvResult.entities.map((e) => e.label).join(', ')}]`
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. PII & HIPAA VECTORS
// ─────────────────────────────────────────────────────────────────────────────
section('3/6  PII & HIPAA');

const piiPayload = `
Patient record \u2013 CONFIDENTIAL:
Name: Rahul Sharma
Email: rahul.sharma@hospital.in
Phone: +91 98765 43210
PAN: ABCDE1234F
Aadhaar: 1234 5678 9012
Diagnosis: Type 2 Diabetes Mellitus with hypertension
Medication: Metformin 500 mg bid
`.trim();

const piiResult = inspectAndMask(piiPayload);

assertDetected(piiResult.entities, 'EMAIL',      'Email address');
assertDetected(piiResult.entities, 'PHONE',      'Phone number');
assertDetected(piiResult.entities, 'PAN',        'PAN card number');
assertDetected(piiResult.entities, 'AADHAAR',    'Aadhaar number');
assertDetected(piiResult.entities, 'DIAGNOSIS',  'Medical diagnosis');
assertDetected(piiResult.entities, 'MEDICATION', 'Prescription medication');
assert(
  piiResult.riskScore > 0,
  `PII risk score > 0 (got ${piiResult.riskScore})`
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. SAFE BASELINE
// ─────────────────────────────────────────────────────────────────────────────
section('4/6  Safe Baseline (React / TypeScript snippet)');

const safePayload = `
import React, { useState, useEffect } from 'react';

interface Props {
  title: string;
  count: number;
  onIncrement: () => void;
}

const Counter: React.FC<Props> = ({ title, count, onIncrement }) => {
  const [localCount, setLocalCount] = useState(count);

  useEffect(() => {
    setLocalCount(count);
  }, [count]);

  return (
    <div className="p-4 rounded shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      <p>Current count: {localCount}</p>
      <button onClick={onIncrement}>Increment</button>
    </div>
  );
};

export default Counter;
`.trim();

const safeResult = inspectAndMask(safePayload);

assert(
  safeResult.riskScore === 0,
  `Safe baseline score === 0`,
  `got ${safeResult.riskScore}`
);
assert(
  safeResult.riskLevel === 'Safe',
  `Safe baseline level === "Safe"`,
  `got "${safeResult.riskLevel}"`
);
assert(
  safeResult.entities.length === 0,
  `Safe baseline: 0 false positives`,
  `got ${safeResult.entities.length}: [${safeResult.entities.map((e) => `${e.label}:"${e.raw}"`).join(', ')}]`
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. REVERSIBILITY
// ─────────────────────────────────────────────────────────────────────────────
section('5/6  Reversibility (unmask \u2192 exact original)');

const reversibilityVectors = [
  { label: 'DevOps payload',          text: devopsPayload    },
  { label: 'Financial payload',        text: financialPayload },
  { label: 'PII & HIPAA payload',      text: piiPayload       },
  { label: 'Safe baseline',            text: safePayload      },
  { label: 'Mixed multi-domain payload', text: [devopsPayload, financialPayload, piiPayload].join('\n\n') },
];

for (const { label, text } of reversibilityVectors) {
  const r        = inspectAndMask(text);
  const restored = unmaskText(r.maskedText, r.tokenMap);
  assert(
    restored === text,
    `Reversibility \u2013 ${label}`,
    restored !== text
      ? `first diff at char ${[...text].findIndex((c, i) => c !== (restored[i] ?? ''))}`
      : ''
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LATENCY BENCHMARK
// ─────────────────────────────────────────────────────────────────────────────
section('6/6  Latency Benchmark (1,000 iterations)');

const mixedBenchPayload = [devopsPayload, financialPayload, piiPayload].join('\n\n---\n\n');
const ITERATIONS        = 1_000;
const TARGET_AVG_MS     = 1.0;

// Warm-up: 5 passes before measurement
for (let w = 0; w < 5; w++) inspectAndMask(mixedBenchPayload);

const t0 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  inspectAndMask(mixedBenchPayload);
}
const t1 = performance.now();

const totalMs    = t1 - t0;
const avgMs      = totalMs / ITERATIONS;
const throughput = Math.round(1000 / avgMs); // calls per second

console.log(`\n  Iterations : ${ITERATIONS.toLocaleString()}`);
console.log(`  Total time : ${totalMs.toFixed(2)} ms`);
console.log(`  Average    : ${avgMs.toFixed(4)} ms / call`);
console.log(`  Throughput : ~${throughput.toLocaleString()} calls/sec`);
console.log(`  Target     : < ${TARGET_AVG_MS} ms / call`);

assert(
  avgMs < TARGET_AVG_MS,
  `Avg latency ${avgMs.toFixed(4)} ms < ${TARGET_AVG_MS} ms`,
  `avg was ${avgMs.toFixed(4)} ms`
);

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log(`  SUMMARY`);
console.log('═'.repeat(60));
console.log(`  Passed : ${totalPassed} / ${totalTests}`);
console.log(`  Failed : ${totalTests - totalPassed}`);

if (failures.length > 0) {
  console.log('\n  Failed assertions:');
  failures.forEach((f) => console.log(`    ${FAIL} ${f}`));
}

const allPassed = totalPassed === totalTests;
console.log(`\n  ${allPassed ? `${PASS} ALL TESTS PASSED` : `${FAIL} SOME TESTS FAILED`}`);
console.log('═'.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
