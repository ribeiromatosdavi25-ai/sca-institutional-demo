'use client';

import { useState } from 'react';

const providerProfiles = [
  {
    name: 'OpenAI (API)',
    profileTitle: 'OpenAI API Integration Profile',
    sections: {
      'Data Processing': [
        'API-based access (no public chatbot interface)',
        'Requests routed through SCA orchestration layer',
        'Optional PII redaction before transmission',
        'No persistent document storage in demo mode',
      ],
      'Data Retention': [
        'Provider retention subject to enterprise configuration',
        'Configurable data minimization layer',
        'Logs stored internally for audit traceability',
      ],
      'Security Controls': [
        'Role-based access enforced at orchestration layer',
        'Human-in-the-loop validation for high-risk outputs',
        'Request tagging and audit logging enabled',
      ],
      'Deployment Options': [
        'Direct API integration',
        'Azure OpenAI (regional compliance)',
        'Hybrid enterprise routing',
      ],
    },
  },
  {
    name: 'Anthropic Claude (API)',
    profileTitle: 'Anthropic API Integration Profile',
    sections: {
      'Data Processing': [
        'Secure API access with structured prompts',
        'Requests routed through SCA orchestration layer',
        'Optional PII redaction before transmission',
        'No persistent document storage in demo mode',
      ],
      'Data Retention': [
        'Provider retention subject to enterprise configuration',
        'Configurable data minimization layer',
        'Logs stored internally for audit traceability',
      ],
      'Security Controls': [
        'Constitutional AI alignment for safer outputs',
        'Human-in-the-loop validation for high-risk outputs',
        'Request tagging and audit logging enabled',
      ],
      'Deployment Options': [
        'Direct API integration',
        'Configurable request routing by policy tier',
      ],
    },
  },
  {
    name: 'Microsoft Copilot (Enterprise Connector)',
    profileTitle: 'Microsoft Copilot Integration Profile',
    sections: {
      'Data Processing': [
        'M365 tenant-bound execution context',
        'Graph-based access through enterprise connector',
        'Requests routed through SCA orchestration layer',
        'No persistent document storage in demo mode',
      ],
      'Data Retention': [
        'Tenant governance policies remain authoritative',
        'Configurable data minimization layer',
        'Logs stored internally for audit traceability',
      ],
      'Security Controls': [
        'Identity-bound execution with role-based access',
        'Human-in-the-loop validation for high-risk outputs',
        'Request tagging and audit logging enabled',
      ],
      'Deployment Options': [
        'Enterprise connector integration',
        'Tenant-level governance controls',
      ],
    },
  },
  {
    name: 'Google Gemini (API)',
    profileTitle: 'Google Gemini API Integration Profile',
    sections: {
      'Data Processing': [
        'Cloud-based API usage with structured outputs',
        'Requests routed through SCA orchestration layer',
        'Optional PII redaction before transmission',
        'No persistent document storage in demo mode',
      ],
      'Data Retention': [
        'Provider retention subject to enterprise configuration',
        'Configurable data minimization layer',
        'Logs stored internally for audit traceability',
      ],
      'Security Controls': [
        'Role-based access enforced at orchestration layer',
        'Human-in-the-loop validation for high-risk outputs',
        'Request tagging and audit logging enabled',
      ],
      'Deployment Options': [
        'Direct API integration',
        'Regional deployment options where available',
      ],
    },
  },
  {
    name: 'Local / On-Prem Models',
    profileTitle: 'On-Prem Model Integration Profile',
    sections: {
      'Data Processing': [
        'Air-gapped deployment potential',
        'Requests routed through SCA orchestration layer',
        'Optional PII redaction before internal processing',
        'No persistent document storage in demo mode',
      ],
      'Data Retention': [
        'Configurable retention policies within internal boundary',
        'Configurable data minimization layer',
        'Logs stored internally for audit traceability',
      ],
      'Security Controls': [
        'Role-based access enforced at orchestration layer',
        'Human-in-the-loop validation for high-risk outputs',
        'Request tagging and audit logging enabled',
      ],
      'Deployment Options': [
        'Fully internal data boundary',
        'Custom guardrail enforcement',
        'Internal inference control',
      ],
    },
  },
];

export function AIServicesPanel() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (name: string) => {
    setExpanded(prev => (prev === name ? null : name));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 transition hover:bg-white/10"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        AI Services Supported
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="AI Services Supported"
            className="relative max-h-[85vh] w-[min(820px,92vw)] overflow-y-auto rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-6 shadow-[var(--shadow-elevated)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">AI Services Supported</h2>
                <p className="mt-1 text-sm text-white/60">Secure API-based orchestration layer</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {providerProfiles.map(provider => (
                <div key={provider.name} className="rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-white/80">{provider.name}</span>
                    <button
                      onClick={() => toggle(provider.name)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
                    >
                      View Compliance Profile
                    </button>
                  </div>
                  {expanded === provider.name && (
                    <div className="border-t border-white/10 bg-black/20 px-4 py-4 text-xs text-white/70">
                      <div className="text-sm font-semibold text-white">{provider.profileTitle}</div>
                      <div className="mt-2 text-[11px] text-white/60">
                        The SCA layer acts as an intermediary control circuit between institutional data and external model providers.
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {Object.entries(provider.sections).map(([title, items]) => (
                          <div key={title}>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">{title}</div>
                            <ul className="mt-2 space-y-2">
                              {items.map(item => (
                                <li key={item} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Secure Data Architecture</h3>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                  Data usage: Secure
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-white/70">
                <div>API-based integration (no direct chatbot usage)</div>
                <div>Data routed through internal orchestration layer</div>
                <div>Guardrails enforce redaction & policy filtering</div>
                <div>No document storage by default (demo mode)</div>
                <div>Role-based execution boundaries</div>
                <div>Human-in-the-loop validation required</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-white/60">
              This platform does not connect to public chat interfaces. AI models are accessed through secure APIs within a controlled orchestration layer. Sensitive data can be filtered, redacted, or restricted before external processing.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
