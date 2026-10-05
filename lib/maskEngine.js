/**
 * PromptMask - Pre-LLM Privacy Firewall & Masking Engine
 * Zero-latency client-side regex and heuristic detection engine.
 */

export const DEFAULT_POLICIES = {
  pii: true,
  secrets: true,
  financial: true,
  health: true,
};

// Weight table for risk score calculation (0 - 100)
const ENTITY_WEIGHTS = {
  // Secrets (Highest threat)
  AWS_KEY: 35,
  AWS_SECRET: 35,
  BEARER_TOKEN: 35,
  JWT_TOKEN: 35,
  PRIVATE_KEY: 40,
  PASSWORD: 30,
  INTERNAL_IP: 15,
  GENERIC_SECRET: 25,

  // Financial (PCI-DSS)
  CREDIT_CARD: 35,
  AMOUNT: 15,

  // PII (GDPR / DPDP)
  AADHAAR: 30,
  PAN: 25,
  EMAIL: 15,
  PHONE: 15,

  // Health (HIPAA)
  MEDICAL_DIAGNOSIS: 25,
  MEDICATION: 15,
  MEDICAL_PROCEDURE: 20,
};

/**
 * Scan rules definitions across 4 policy domains
 */
function getRules() {
  return [
    // ==========================================
    // 1. SECRETS & CREDENTIALS POLICY
    // ==========================================
    {
      policy: 'secrets',
      type: 'SECRET',
      label: 'Private Key',
      tokenPrefix: 'PRIVATE_KEY',
      regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    },
    {
      policy: 'secrets',
      type: 'SECRET',
      label: 'AWS Access Key',
      tokenPrefix: 'AWS_KEY',
      regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    },
    {
      policy: 'secrets',
      type: 'SECRET',
      label: 'AWS Secret Key',
      tokenPrefix: 'AWS_SECRET',
      regex: /(?:AWS_SECRET_ACCESS_KEY\s*[:=]\s*["']?)([A-Za-z0-9/+=]{40})(?:["']?)/gi,
      valueGroup: 1,
    },
    {
      policy: 'secrets',
      type: 'SECRET',
      label: 'Bearer / JWT Token',
      tokenPrefix: 'BEARER_TOKEN',
      regex: /\bBearer\s+(?:eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+|[A-Za-z0-9\-_.+/=]{24,})\b/gi,
    },
    {
      policy: 'secrets',
      type: 'SECRET',
      label: 'JWT Token',
      tokenPrefix: 'JWT_TOKEN',
      regex: /\beyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\b/g,
    },
    {
      policy: 'secrets',
      type: 'SECRET',
      label: 'Database Password',
      tokenPrefix: 'PASSWORD',
      regex: /(?:DB_PASSWORD|PASSWORD|SECRET_KEY|API_KEY)\s*[:=]\s*["']([^"'\r\n]+)["']/gi,
      valueGroup: 1,
    },
    {
      policy: 'secrets',
      type: 'SECRET',
      label: 'Internal RFC1918 IP',
      tokenPrefix: 'INTERNAL_IP',
      regex: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
    },

    // ==========================================
    // 2. FINANCIAL (PCI-DSS) POLICY
    // ==========================================
    {
      policy: 'financial',
      type: 'FINANCIAL',
      label: 'Credit Card',
      tokenPrefix: 'CREDIT_CARD',
      regex: /\b(?:4\d{3}|5[1-5]\d{2}|6011)[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b|\b3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}\b/g,
    },
    {
      policy: 'financial',
      type: 'FINANCIAL',
      label: 'Monetary Amount',
      tokenPrefix: 'AMOUNT',
      regex: /(?:(?:\$|€|£|¥|₹|INR|USD)\s?\d+(?:,\d{2,3})*(?:\.\d{1,2})?|\b\d+(?:,\d{2,3})*(?:\.\d{1,2})?\s?(?:USD|INR|EUR|GBP)\b)/g,
    },

    // ==========================================
    // 3. PII (GDPR / DPDP) POLICY
    // ==========================================
    {
      policy: 'pii',
      type: 'PII',
      label: 'Indian PAN Card',
      tokenPrefix: 'PAN',
      regex: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
    },
    {
      policy: 'pii',
      type: 'PII',
      label: 'Indian Aadhaar Number',
      tokenPrefix: 'AADHAAR',
      regex: /\b\d{4}\s\d{4}\s\d{4}\b/g,
    },
    {
      policy: 'pii',
      type: 'PII',
      label: 'Email Address',
      tokenPrefix: 'EMAIL',
      regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    },
    {
      policy: 'pii',
      type: 'PII',
      label: 'Phone Number',
      tokenPrefix: 'PHONE',
      regex: /(?:\+91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g,
    },

    // ==========================================
    // 4. HEALTH (HIPAA) POLICY
    // ==========================================
    {
      policy: 'health',
      type: 'HEALTH',
      label: 'Medical Diagnosis',
      tokenPrefix: 'DIAGNOSIS',
      regex: /\b(?:Stage\s+[I|II|III|IV]+(?:\s+Type\s+[12]\s+Diabetes(?:\s+Mellitus)?|\s+[a-zA-Z]+)*|Type\s+[12]\s+Diabetes(?:\s+Mellitus)?|Coronary Artery Disease|chronic hypertension|hypertension|depressive disorder|bipolar(?: I| II)? disorder|schizophrenia|carcinoma|melanoma|chemotherapy|HIV(?: test| positive)?|AIDS|elevated creatinine)\b/gi,
    },
    {
      policy: 'health',
      type: 'HEALTH',
      label: 'Medical Procedure',
      tokenPrefix: 'PROCEDURE',
      regex: /\b(?:cardiac biopsy|skin biopsy|biopsy|lumbar puncture|MRI scan|CT scan|angioplasty|radiation therapy)\b/gi,
    },
    {
      policy: 'health',
      type: 'HEALTH',
      label: 'Prescription Medication',
      tokenPrefix: 'MEDICATION',
      regex: /\b(?:Metformin(?:\s+\d+\s*mg(?:\s+bid)?)?|Lisinopril(?:\s+\d+\s*mg(?:\s+daily)?)?|Atorvastatin|Amlodipine|Omeprazole|Amoxicillin|Insulin|Sertraline)\b/gi,
    },
  ];
}

/**
 * Deterministic Risk Score computation (0 - 100)
 */
export function calculateRiskScore(entities) {
  if (!entities || entities.length === 0) return 0;

  let score = 0;
  for (const entity of entities) {
    const weight = ENTITY_WEIGHTS[entity.tokenPrefix] || 15;
    score += weight;
  }

  // Cap risk score between 0 and 100
  return Math.min(100, Math.round(score));
}

/**
 * Determine human-readable risk tier
 */
export function determineRiskLevel(score, entities = []) {
  if (score === 0) return 'Safe';
  
  // Instant Critical trigger if raw private keys, high secrets, or credit card found
  const hasCriticalEntity = entities.some(
    (e) => e.type === 'SECRET' || e.tokenPrefix === 'CREDIT_CARD' || e.tokenPrefix === 'PRIVATE_KEY'
  );

  if (score >= 70 || (score >= 50 && hasCriticalEntity)) {
    return 'Critical';
  }
  return 'Warning';
}

/**
 * Resolves overlapping entity intervals by greedy span selection:
 * Sorts by startIndex asc, then span length desc.
 * Keeps non-intersecting spans.
 */
function resolveNonOverlappingSpans(candidates) {
  // Sort primarily by startIndex, secondarily by longest span
  const sorted = [...candidates].sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });

  const selected = [];
  let lastEnd = -1;

  for (const candidate of sorted) {
    // Only pick if it does not overlap with the previously accepted span
    if (candidate.startIndex >= lastEnd) {
      selected.push(candidate);
      lastEnd = candidate.endIndex;
    }
  }

  return selected;
}

/**
 * Inspect raw prompt, extract entities based on active policies,
 * tokenize sensitive spans, and compute risk telemetry.
 *
 * @param {string} text - Raw input prompt
 * @param {object} activePolicies - Toggled policies { pii, secrets, financial, health }
 * @returns {object} { originalText, maskedText, entities, riskScore, riskLevel, tokenMap }
 */
export function inspectAndMask(text = '', activePolicies = DEFAULT_POLICIES) {
  if (!text || typeof text !== 'string') {
    return {
      originalText: text || '',
      maskedText: text || '',
      entities: [],
      riskScore: 0,
      riskLevel: 'Safe',
      tokenMap: {},
    };
  }

  const policies = { ...DEFAULT_POLICIES, ...activePolicies };
  const allRules = getRules();
  const candidateMatches = [];

  // 1. Gather all candidate pattern matches
  for (const rule of allRules) {
    if (!policies[rule.policy]) {
      continue; // Skip inactive policies
    }

    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      let raw = match[0];
      let startIndex = match.index;
      let endIndex = startIndex + raw.length;

      // Handle capture group if specified (e.g. secret value inside DB_PASSWORD="xyz")
      if (rule.valueGroup && match[rule.valueGroup]) {
        const fullMatch = match[0];
        const groupValue = match[rule.valueGroup];
        const groupOffset = fullMatch.indexOf(groupValue);
        if (groupOffset !== -1) {
          startIndex = match.index + groupOffset;
          endIndex = startIndex + groupValue.length;
          raw = groupValue;
        }
      }

      candidateMatches.push({
        type: rule.type,
        policy: rule.policy,
        label: rule.label,
        tokenPrefix: rule.tokenPrefix,
        raw,
        startIndex,
        endIndex,
      });

      // Guard against zero-width match loops
      if (regex.lastIndex === match.index) {
        regex.lastIndex++;
      }
    }
  }

  // 2. Resolve non-overlapping spans
  const nonOverlapping = resolveNonOverlappingSpans(candidateMatches);

  // 3. Assign sequential surrogate tokens (e.g., <AWS_KEY_1>, <PHONE_1>)
  const counters = {};
  const tokenMap = {};
  const entities = [];

  for (let i = 0; i < nonOverlapping.length; i++) {
    const item = nonOverlapping[i];
    const prefix = item.tokenPrefix;
    counters[prefix] = (counters[prefix] || 0) + 1;
    const token = `<${prefix}_${counters[prefix]}>`;

    const entityRecord = {
      id: `ENT-${String(i + 1).padStart(3, '0')}`,
      type: item.type,
      policy: item.policy,
      label: item.label,
      tokenPrefix: item.tokenPrefix,
      raw: item.raw,
      token,
      startIndex: item.startIndex,
      endIndex: item.endIndex,
    };

    entities.push(entityRecord);
    tokenMap[token] = item.raw;
  }

  // 4. Construct sanitized maskedText
  // Replace from right to left to preserve offsets
  let maskedText = text;
  const sortedForReplacement = [...entities].sort((a, b) => b.startIndex - a.startIndex);

  for (const ent of sortedForReplacement) {
    maskedText =
      maskedText.slice(0, ent.startIndex) +
      ent.token +
      maskedText.slice(ent.endIndex);
  }

  // 5. Compute Risk Score & Tier
  const riskScore = calculateRiskScore(entities);
  const riskLevel = determineRiskLevel(riskScore, entities);

  return {
    originalText: text,
    maskedText,
    entities,
    riskScore,
    riskLevel,
    tokenMap,
  };
}

/**
 * Reconstitutes the original text from a masked payload using tokenMap
 */
export function unmaskText(maskedText, tokenMap) {
  if (!maskedText || !tokenMap) return maskedText;
  let reconstituted = maskedText;
  for (const [token, original] of Object.entries(tokenMap)) {
    reconstituted = reconstituted.replaceAll(token, original);
  }
  return reconstituted;
}

