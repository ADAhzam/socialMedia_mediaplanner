'use strict';

const INDUSTRY_INTERESTS = {
  general_recruitment: ['Employment', 'Recruitment'],
  healthcare: ['Healthcare', 'Nursing', 'Healthcare careers'],
  software_tech: ['Software', 'Technology', 'Information technology'],
  logistics: ['Logistics', 'Supply chain', 'Transportation'],
  retail_hospitality: ['Retail', 'Hospitality', 'Customer service'],
};

const INDUSTRY_LABEL = {
  general_recruitment: 'General Recruitment',
  healthcare: 'Healthcare',
  software_tech: 'Software & Tech',
  logistics: 'Logistics & Supply Chain',
  retail_hospitality: 'Retail & Hospitality',
};

// Deterministic audience spec from the brief. AM edits afterward.
function buildTargeting(plan) {
  const roles = (plan.roleGroups || []).map((r) => r.name);
  const industry = plan.industry;
  const competitors = plan.competitors || [];

  return {
    meta: {
      location: plan.geoLabel,
      specialAdCategory: true,
      locked: 'Age 18+, all genders (Special Ad Category: Recruitment)',
      interestFunction: roles,
      interestIndustry: INDUSTRY_INTERESTS[industry] || [],
      careerIntent: ['Job hunting', 'Career development', 'Employment'],
      retargeting: [
        'Careers-page visitors (30 / 60 / 90-day)',
        'Video viewers (25%+ completion)',
        'Lookalike of hired pool (when available)',
      ],
      note: 'Special Ad Category disables detailed-targeting exclusions — keep audiences broad and let role-specific creative self-select.',
    },
    google: {
      inMarketAudiences: [`Jobs – ${INDUSTRY_LABEL[industry] || 'Recruitment'}`, 'Employment Services'],
      customIntentUrls: ['indeed.com', 'linkedin.com/jobs', 'glassdoor.com'],
      geo: plan.geoLabel,
      negativeGeo: plan.geoExclusions || [],
      competitorConquest: competitors.length
        ? `Bid on competitor brand terms: ${competitors.join(', ')}`
        : 'No competitors provided',
    },
  };
}

module.exports = { buildTargeting, INDUSTRY_INTERESTS, INDUSTRY_LABEL };
