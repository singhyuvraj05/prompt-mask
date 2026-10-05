import { inspectAndMask, unmaskText } from '../lib/maskEngine.js';
import fs from 'fs';
import path from 'path';

const presetsPath = path.resolve('data/presets.json');
const presets = JSON.parse(fs.readFileSync(presetsPath, 'utf-8'));
console.log(`Loaded ${presets.length} presets from ${presetsPath}.\n`);

let allPassed = true;

for (const preset of presets) {
  console.log(`=================================================`);
  console.log(`Testing: ${preset.name} [${preset.category}]`);
  console.log(`=================================================`);
  const result = inspectAndMask(preset.prompt);
  console.log(`Risk Score: ${result.riskScore} / 100 | Risk Level: ${result.riskLevel}`);
  console.log(`Entities Detected: ${result.entities.length}`);

  result.entities.forEach((ent) => {
    console.log(`  [${ent.policy.toUpperCase()}] ${ent.label}: "${ent.raw}" -> ${ent.token}`);
  });

  console.log(`\nMasked text preview:`);
  console.log(result.maskedText.split('\n')[0]);

  // Test reversibility
  const restored = unmaskText(result.maskedText, result.tokenMap);
  const isReversible = restored === preset.prompt;
  console.log(`Reversibility Check: ${isReversible ? 'PASSED ✅' : 'FAILED ❌'}`);
  if (!isReversible) allPassed = false;
  console.log();
}

// Test Safe prompt specifically
const safePreset = presets.find((p) => p.id === 'safe-prompt');
const safeResult = inspectAndMask(safePreset.prompt);
if (safeResult.riskScore !== 0 || safeResult.riskLevel !== 'Safe' || safeResult.entities.length !== 0) {
  console.error('Safe prompt failed expectations!');
  allPassed = false;
} else {
  console.log('Safe prompt verified: Score 0, Level "Safe", 0 entities. ✅');
}

// Test policy toggles (e.g. disabling secrets)
const devOpsPreset = presets.find((p) => p.id === 'devops-leak');
const withoutSecrets = inspectAndMask(devOpsPreset.prompt, {
  pii: true,
  secrets: false,
  financial: true,
  health: true,
});
console.log(`DevOps without secrets policy: ${withoutSecrets.entities.length} entities (should be 0)`);
if (withoutSecrets.entities.length !== 0) {
  allPassed = false;
}

console.log(`\nOverall Test Result: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES OCCURRED ❌'}`);

