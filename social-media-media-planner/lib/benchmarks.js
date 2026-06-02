'use strict';

// Reference (client-facing at margin = 1.0) rates. Each entry: { cpc, ctr }.
// ctr is a percentage. cpm is always derived. New channels/industries are
// added by following this same shape (Plan 2 extends to non-Google/Meta channels).
const BENCHMARKS = {
  general_recruitment: {
    google_search:   { cpc: 3.00, ctr: 6.5 },
    google_display:  { cpc: 1.56, ctr: 0.30 },
    meta_feed_image: { cpc: 1.80, ctr: 1.6 },
    meta_feed_video: { cpc: 1.35, ctr: 1.2 },
    meta_reels:      { cpc: 1.20, ctr: 1.0 },
  },
  healthcare: {
    google_search:   { cpc: 4.40, ctr: 7.2 },
    google_display:  { cpc: 2.28, ctr: 0.35 },
    meta_feed_image: { cpc: 2.64, ctr: 1.8 },
    meta_feed_video: { cpc: 1.98, ctr: 1.4 },
    meta_reels:      { cpc: 1.76, ctr: 1.2 },
  },
  software_tech: {
    google_search:   { cpc: 2.08, ctr: 8.6 },
    google_display:  { cpc: 1.08, ctr: 0.40 },
    meta_feed_image: { cpc: 1.25, ctr: 2.0 },
    meta_feed_video: { cpc: 0.94, ctr: 1.5 },
    meta_reels:      { cpc: 0.83, ctr: 1.3 },
  },
  logistics: {
    google_search:   { cpc: 1.70, ctr: 6.0 },
    google_display:  { cpc: 0.88, ctr: 0.28 },
    meta_feed_image: { cpc: 1.02, ctr: 1.4 },
    meta_feed_video: { cpc: 0.77, ctr: 1.1 },
    meta_reels:      { cpc: 0.68, ctr: 0.9 },
  },
  retail_hospitality: {
    google_search:   { cpc: 1.44, ctr: 5.8 },
    google_display:  { cpc: 0.75, ctr: 0.25 },
    meta_feed_image: { cpc: 0.86, ctr: 1.3 },
    meta_feed_video: { cpc: 0.65, ctr: 1.0 },
    meta_reels:      { cpc: 0.58, ctr: 0.85 },
  },
};

const GEO_MULTIPLIER = {
  us: 1.0, uk: 1.15, eu_west: 0.90, australia: 1.05, canada: 0.85, india: 0.20,
};

// The swap-seam: Plan-2+ can replace the body to read live Joveo data while
// keeping this exact signature. metric in {'cpc','ctr','cpm'}.
function getBenchmark(channel, industry, geo, metric) {
  const ind = BENCHMARKS[industry];
  if (!ind) throw new Error(`Unknown industry: ${industry}`);
  const ch = ind[channel];
  if (!ch) throw new Error(`Unknown channel: ${channel} for industry ${industry}`);
  const mult = GEO_MULTIPLIER[geo];
  if (mult === undefined) throw new Error(`Unknown geo: ${geo}`);

  if (metric === 'ctr') return ch.ctr;
  if (metric === 'cpc') return ch.cpc * mult;
  if (metric === 'cpm') return ch.cpc * mult * (ch.ctr / 100) * 1000;
  throw new Error(`Unknown metric: ${metric}`);
}

module.exports = { BENCHMARKS, GEO_MULTIPLIER, getBenchmark };
