# PromptMask 🛡️
> **Client-Side Pre-LLM Privacy Firewall & Surrogate Tokenizer**  
> Intercept enterprise credentials, infrastructure secrets, PCI-DSS card data, and PII in `<1ms` before prompts leave the client device.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.8-black?logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Bundler-Turbopack-blueviolet)](https://turbo.build/)
[![Execution](https://img.shields.io/badge/Latency-%3C1ms-success)](#performance)
[![Privacy](https://img.shields.io/badge/Privacy-Zero--Knowledge-brightgreen)](#architecture)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

---

## 🚨 The Problem

Enterprise developers paste production connection strings, cloud keys, customer records, and internal code snippets into ChatGPT, Claude, and cloud LLMs every day:
1. **Third-Party Data Ingestion:** Plaintext secrets enter public LLM training corpora, inference logs, and cache layers.
2. **Centralized Proxy Pitfalls:** Traditional DLP firewalls route prompts through an intermediary inspection server, creating an external honeypot and adding 150–400ms latency.
3. **Redaction Destroys Context:** Replacing secrets with `[REDACTED]` destroys code syntax, variable dependencies, and LLM reasoning accuracy.

---

## ⚡ The Solution: Zero-Knowledge Surrogate Tokenization

**PromptMask** acts as an in-browser pre-flight security layer. It scans prompts locally across multi-vector threat policies, replaces sensitive entities with context-aware surrogate tokens, and maintains an ephemeral client-side token lookup table.

```text
[ Developer Prompt ] 
        │
        ▼
[ PromptMask Client Engine (<1ms) ] ──▶ [ Ephemeral In-Memory Token Matrix ]
        │                                             ▲
        ▼ (Sanitized Payload)                         │ (Local Rehydration)
[ External LLM Provider (ChatGPT/Claude) ]            │
        │                                             │
        ▼ (LLM Response referencing <TOKEN_n>)        │
[ Client Unmasking Layer ] ───────────────────────────┘
        │
        ▼
[ Restored Developer Output ]
