'use client';

import { useState, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tier {
  name: string;
  budget: number;
  recommended: boolean;
  clicks: number;
  impressions: number;
}

interface PreviewResult {
  tiers: Tier[];
  warnings: string[];
  clientName: string;
}

interface FormState {
  // Client & Brand
  clientName: string;
  brandMode: 'joveo' | 'cobranded' | 'whitelabel';
  accentColor: string;
  logoPath: string;
  // Campaign
  industry: string;
  geo: string;
  geoLabel: string;
  archetype: 'branding' | 'jobad';
  objectiveLabel: string;
  monthlyBudget: string;
  // Roles & Locations
  roles: string;
  locations: string;
  // Modules
  modules: { targeting: boolean; keywords: boolean };
  // Insights
  insights: {
    activePassive: { passivePct: string; activePct: string; note: string };
    competitors: string;
  };
  // Steering
  marginMultiplier: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: FormState = {
  clientName: '',
  brandMode: 'joveo',
  accentColor: '#C0243A',
  logoPath: '',
  industry: 'healthcare',
  geo: 'uk',
  geoLabel: 'United Kingdom',
  archetype: 'branding',
  objectiveLabel: 'Employer Branding',
  monthlyBudget: '9000',
  roles: '',
  locations: '',
  modules: { targeting: true, keywords: false },
  insights: {
    activePassive: { passivePct: '70', activePct: '30', note: '' },
    competitors: '',
  },
  marginMultiplier: '1.0',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-GB');
}

function buildBody(f: FormState) {
  return {
    clientName: f.clientName,
    brandMode: f.brandMode,
    accentColor: f.accentColor,
    logoPath: f.logoPath || undefined,
    industry: f.industry,
    geo: f.geo,
    geoLabel: f.geoLabel,
    archetype: f.archetype,
    objectiveLabel: f.objectiveLabel,
    monthlyBudget: Number(f.monthlyBudget) || 0,
    roles: f.roles,
    locations: f.locations,
    marginMultiplier: Number(f.marginMultiplier) || 1.0,
    modules: f.modules,
    insights: {
      activePassive: {
        passivePct: Number(f.insights.activePassive.passivePct) || 0,
        activePct: Number(f.insights.activePassive.activePct) || 0,
        note: f.insights.activePassive.note,
      },
      competitors: f.insights.competitors || undefined,
    },
  };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconChart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 16V10M12 16V8M17 16V12" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13M7 11l5 5 5-5" />
      <path d="M3 20h18" />
    </svg>
  );
}

function IconPreview() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconWarn() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconError() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mp-error-icon">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MediaPlannerPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [advanced, setAdvanced] = useState(false);

  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  // ── field helpers ──
  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }
  function setInsightAP(field: keyof FormState['insights']['activePassive'], val: string) {
    setForm((prev) => ({
      ...prev,
      insights: {
        ...prev.insights,
        activePassive: { ...prev.insights.activePassive, [field]: val },
      },
    }));
  }
  function setModule(key: keyof FormState['modules'], val: boolean) {
    setForm((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: val },
    }));
  }

  // ── preview ──
  async function handlePreview() {
    setPreviewing(true);
    setPreviewError(null);
    setDownloadError(null);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(form)),
      });
      const data = await res.json();
      if (!data.ok) {
        setPreviewError(data.error || 'Unknown error from API');
        setPreviewResult(null);
      } else {
        setPreviewResult({ tiers: data.tiers, warnings: data.warnings ?? [], clientName: form.clientName });
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : 'Network error');
      setPreviewResult(null);
    } finally {
      setPreviewing(false);
    }
  }

  // ── download ──
  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(form)),
      });
      if (!res.ok) {
        const data = await res.json();
        setDownloadError(data.error || `Server error ${res.status}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (form.clientName || 'media-plan') + '.pptx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setDownloading(false);
    }
  }

  const busy = previewing || downloading;

  return (
    <>
      {/* ── Header ── */}
      <header className="mp-header">
        <div className="mp-logo">
          <div className="mp-logo-mark">J</div>
          Joveo Media Planner
        </div>
        <span className="mp-header-pill">Internal Tool</span>
      </header>

      <div className="mp-shell">
        {/* ══════════════ LEFT: FORM ══════════════ */}
        <div className="mp-form-panel">
          <p className="mp-form-title">New Media Plan</p>
          <p className="mp-form-sub">Fill in the details below to generate a tiered plan and downloadable deck.</p>

          {/* ── 1. Client & Brand ── */}
          <div className="mp-section">
            <div className="mp-section-label">Client &amp; Brand</div>

            <div className="mp-field">
              <label htmlFor="clientName" className="mp-label">Client name</label>
              <input
                id="clientName"
                type="text"
                className="mp-input"
                placeholder="e.g. Acme Healthcare"
                value={form.clientName}
                onChange={(e) => set('clientName', e.target.value)}
              />
            </div>

            <div className="mp-field">
              <label htmlFor="brandMode" className="mp-label">Brand mode</label>
              <select
                id="brandMode"
                className="mp-select"
                value={form.brandMode}
                onChange={(e) => set('brandMode', e.target.value as FormState['brandMode'])}
              >
                <option value="joveo">Joveo</option>
                <option value="cobranded">Co-branded</option>
                <option value="whitelabel">White-label</option>
              </select>
            </div>

            {form.brandMode === 'cobranded' && (
              <div className="mp-field">
                <label htmlFor="accentColor" className="mp-label">Accent colour</label>
                <div className="mp-color-row">
                  <div className="mp-color-swatch" title="Pick colour">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => set('accentColor', e.target.value)}
                      aria-label="Accent colour picker"
                    />
                  </div>
                  <input
                    id="accentColor"
                    type="text"
                    className="mp-input mp-color-text"
                    value={form.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                    placeholder="#C0243A"
                    maxLength={9}
                  />
                </div>
              </div>
            )}

            <div className="mp-field">
              <label htmlFor="logoPath" className="mp-label">
                Logo URL <span className="mp-label-hint">(optional)</span>
              </label>
              <input
                id="logoPath"
                type="url"
                className="mp-input"
                placeholder="https://…/logo.png"
                value={form.logoPath}
                onChange={(e) => set('logoPath', e.target.value)}
              />
            </div>
          </div>

          {/* ── 2. Campaign ── */}
          <div className="mp-section">
            <div className="mp-section-label">Campaign</div>

            <div className="mp-row-2">
              <div className="mp-field">
                <label htmlFor="industry" className="mp-label">Industry</label>
                <select
                  id="industry"
                  className="mp-select"
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                >
                  <option value="general_recruitment">General Recruitment</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="software_tech">Software &amp; Tech</option>
                  <option value="logistics">Logistics</option>
                  <option value="retail_hospitality">Retail &amp; Hospitality</option>
                </select>
              </div>
              <div className="mp-field">
                <label htmlFor="archetype" className="mp-label">Archetype</label>
                <select
                  id="archetype"
                  className="mp-select"
                  value={form.archetype}
                  onChange={(e) => set('archetype', e.target.value as FormState['archetype'])}
                >
                  <option value="branding">Branding</option>
                  <option value="jobad">Job Ads</option>
                </select>
              </div>
            </div>

            <div className="mp-row-2">
              <div className="mp-field">
                <label htmlFor="geo" className="mp-label">Geography</label>
                <select
                  id="geo"
                  className="mp-select"
                  value={form.geo}
                  onChange={(e) => set('geo', e.target.value)}
                >
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="eu_west">EU West</option>
                  <option value="australia">Australia</option>
                  <option value="canada">Canada</option>
                  <option value="india">India</option>
                </select>
              </div>
              <div className="mp-field">
                <label htmlFor="geoLabel" className="mp-label">Geo label</label>
                <input
                  id="geoLabel"
                  type="text"
                  className="mp-input"
                  placeholder="e.g. United Kingdom"
                  value={form.geoLabel}
                  onChange={(e) => set('geoLabel', e.target.value)}
                />
              </div>
            </div>

            <div className="mp-row-2">
              <div className="mp-field">
                <label htmlFor="objectiveLabel" className="mp-label">Objective label</label>
                <input
                  id="objectiveLabel"
                  type="text"
                  className="mp-input"
                  placeholder="e.g. Employer Branding"
                  value={form.objectiveLabel}
                  onChange={(e) => set('objectiveLabel', e.target.value)}
                />
              </div>
              <div className="mp-field">
                <label htmlFor="monthlyBudget" className="mp-label">Monthly budget (£)</label>
                <input
                  id="monthlyBudget"
                  type="number"
                  className="mp-input"
                  placeholder="9000"
                  min={0}
                  step={100}
                  value={form.monthlyBudget}
                  onChange={(e) => set('monthlyBudget', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── 3. Roles & Locations ── */}
          <div className="mp-section">
            <div className="mp-section-label">Roles &amp; Locations</div>

            <div className="mp-field">
              <label htmlFor="roles" className="mp-label">Role groups</label>
              <p className="mp-label-hint">Comma-separated, e.g. Nurses, Doctors, Paramedics</p>
              <input
                id="roles"
                type="text"
                className="mp-input"
                placeholder="e.g. Nurses, Doctors"
                value={form.roles}
                onChange={(e) => set('roles', e.target.value)}
              />
            </div>

            <div className="mp-field">
              <label htmlFor="locations" className="mp-label">Locations</label>
              <p className="mp-label-hint">Comma-separated, e.g. London, Manchester, Bristol</p>
              <input
                id="locations"
                type="text"
                className="mp-input"
                placeholder="e.g. London, Manchester"
                value={form.locations}
                onChange={(e) => set('locations', e.target.value)}
              />
            </div>
          </div>

          {/* ── 4. Modules ── */}
          <div className="mp-section">
            <div className="mp-section-label">Modules</div>

            <div className="mp-checkbox-group">
              <label className="mp-checkbox-item">
                <input
                  type="checkbox"
                  checked={form.modules.targeting}
                  onChange={(e) => setModule('targeting', e.target.checked)}
                />
                <span className="mp-checkbox-label">Audience targeting</span>
              </label>
              <label className="mp-checkbox-item">
                <input
                  type="checkbox"
                  checked={form.modules.keywords}
                  onChange={(e) => setModule('keywords', e.target.checked)}
                />
                <span className="mp-checkbox-label">Keyword campaigns</span>
              </label>
            </div>
          </div>

          {/* ── 5. Insights (optional) ── */}
          <div className="mp-section">
            <div className="mp-section-label">Insights <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '10px', color: 'var(--slate-light)' }}>(optional)</span></div>

            <div className="mp-ap-row">
              <div className="mp-field" style={{ marginBottom: 0 }}>
                <label htmlFor="passivePct" className="mp-label">Passive audience %</label>
                <input
                  id="passivePct"
                  type="number"
                  className="mp-input"
                  min={0}
                  max={100}
                  placeholder="70"
                  value={form.insights.activePassive.passivePct}
                  onChange={(e) => setInsightAP('passivePct', e.target.value)}
                />
              </div>
              <div className="mp-field" style={{ marginBottom: 0 }}>
                <label htmlFor="activePct" className="mp-label">Active audience %</label>
                <input
                  id="activePct"
                  type="number"
                  className="mp-input"
                  min={0}
                  max={100}
                  placeholder="30"
                  value={form.insights.activePassive.activePct}
                  onChange={(e) => setInsightAP('activePct', e.target.value)}
                />
              </div>
            </div>

            <div className="mp-field" style={{ marginTop: '0.75rem' }}>
              <label htmlFor="apNote" className="mp-label">Note</label>
              <input
                id="apNote"
                type="text"
                className="mp-input"
                placeholder="e.g. Source: LinkedIn Talent Insights"
                value={form.insights.activePassive.note}
                onChange={(e) => setInsightAP('note', e.target.value)}
              />
            </div>

            <div className="mp-field">
              <label htmlFor="competitors" className="mp-label">Competitors</label>
              <p className="mp-label-hint">Comma-separated company names</p>
              <input
                id="competitors"
                type="text"
                className="mp-input"
                placeholder="e.g. BUPA, Spire, HCA"
                value={form.insights.competitors}
                onChange={(e) => set('insights', { ...form.insights, competitors: e.target.value })}
              />
            </div>
          </div>

          {/* ── 6. Advanced / Steering (collapsed) ── */}
          <button
            type="button"
            className="mp-advanced-toggle"
            aria-expanded={advanced}
            onClick={() => setAdvanced((v) => !v)}
          >
            <IconChevron />
            Advanced steering
          </button>
          <div className={`mp-advanced-content${advanced ? ' open' : ''}`} aria-hidden={!advanced}>
            <div className="mp-field" style={{ marginTop: '1rem' }}>
              <label htmlFor="marginMultiplier" className="mp-label">Margin multiplier</label>
              <p className="mp-label-hint">Applied to all budget allocations. Default: 1.0</p>
              <input
                id="marginMultiplier"
                type="number"
                className="mp-input"
                min={0.1}
                max={5}
                step={0.05}
                value={form.marginMultiplier}
                onChange={(e) => set('marginMultiplier', e.target.value)}
              />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="mp-actions">
            <button
              type="button"
              className="mp-btn mp-btn-primary"
              onClick={handlePreview}
              disabled={busy}
              aria-label="Preview media plan tiers"
            >
              {previewing ? <span className="mp-spinner" aria-hidden="true" /> : <IconPreview />}
              {previewing ? 'Calculating…' : 'Preview plan'}
            </button>

            <button
              type="button"
              className="mp-btn mp-btn-crimson"
              onClick={handleDownload}
              disabled={busy}
              aria-label="Download PowerPoint deck"
            >
              {downloading ? <span className="mp-spinner" aria-hidden="true" /> : <IconDownload />}
              {downloading ? 'Generating…' : 'Download deck'}
            </button>
          </div>

          {/* Inline errors below actions */}
          {downloadError && (
            <div className="mp-error-banner" role="alert">
              <IconError />
              <span><strong>Deck error:</strong> {downloadError}</span>
            </div>
          )}
        </div>

        {/* ══════════════ RIGHT: RESULT ══════════════ */}
        <div className="mp-result-panel" ref={resultRef}>
          {previewError ? (
            <div key="err" className="mp-animate-in">
              <div className="mp-result-panel-header">
                <span className="mp-result-panel-title">Plan Preview</span>
              </div>
              <div className="mp-error-banner" role="alert">
                <IconError />
                <span><strong>Error:</strong> {previewError}</span>
              </div>
            </div>
          ) : previewResult ? (
            <div key="result" className="mp-animate-in">
              <div className="mp-result-panel-header">
                <div>
                  <div className="mp-result-panel-title">Plan Preview</div>
                  {previewResult.clientName && (
                    <div className="mp-result-client-name">{previewResult.clientName}</div>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--slate-light)' }}>3 tiers generated</span>
              </div>

              <div className="mp-tier-wrap">
                <div className="mp-result-heading">Budget tiers</div>
                <table className="mp-tier-table" aria-label="Media plan budget tiers">
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th>Budget</th>
                      <th>Est. clicks</th>
                      <th>Est. impressions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.tiers.map((tier) => (
                      <tr key={tier.name} className={tier.recommended ? 'recommended-row' : ''}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{tier.name}</span>
                          {tier.recommended && (
                            <span className="mp-recommended-badge">
                              <span className="mp-star">★</span> Recommended
                            </span>
                          )}
                        </td>
                        <td className="mp-num">£{fmt(tier.budget)}</td>
                        <td className="mp-num">{fmt(tier.clicks)}</td>
                        <td className="mp-num">{fmt(tier.impressions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewResult.warnings.length > 0 && (
                <div className="mp-warnings">
                  <div className="mp-warnings-title">Warnings</div>
                  {previewResult.warnings.map((w, i) => (
                    <div key={i} className="mp-warning-item">
                      <div className="mp-warning-dot" aria-hidden="true" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1.75rem', padding: '1rem 1.25rem', background: 'var(--navy-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: 'var(--navy)', opacity: 0.7 }}><IconWarn /></div>
                <p style={{ fontSize: '12px', color: 'var(--slate)', margin: 0, lineHeight: '1.5' }}>
                  Ready to present? Click <strong style={{ color: 'var(--crimson)' }}>Download deck</strong> to generate the PowerPoint file with these figures.
                </p>
              </div>
            </div>
          ) : (
            <div className="mp-result-empty">
              <div className="mp-result-empty-icon">
                <IconChart />
              </div>
              <div className="mp-result-empty-title">No preview yet</div>
              <p className="mp-result-empty-sub">
                Complete the form and click <strong>Preview plan</strong> to see budget tiers and estimated performance.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
