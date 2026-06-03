'use strict';

const STANDARD_NEGATIVES = [
  { term: 'internship', reason: 'Intern roles — wrong seniority' },
  { term: 'summer internship', reason: 'Seasonal intern — wrong audience' },
  { term: 'part time', reason: 'Part-time seekers — roles are full-time' },
  { term: 'volunteer', reason: 'Volunteer intent — not hiring' },
  { term: 'freelance', reason: 'Freelance/contract — roles are permanent' },
  { term: 'work from home', reason: 'Remote-only seekers — roles are on-site/hybrid' },
];

function buildKeywords(plan) {
  const company = (plan.client && plan.client.name) || 'the employer';
  const loc = plan.geoLabel || '';
  const roles = (plan.roleGroups || []).map((r) => r.name);

  const clusters = [];
  roles.forEach((role) => {
    const r = role.toLowerCase();
    clusters.push({
      role, type: 'Function + Location', matchType: 'Phrase',
      terms: [
        `${r} jobs ${loc}`.trim(),
        `${r} jobs`,
        `${r} vacancies ${loc}`.trim(),
      ],
    });
    clusters.push({
      role, type: 'Brand', matchType: 'Exact',
      terms: [
        `${company.toLowerCase()} ${r} jobs`,
        `${company.toLowerCase()} careers`,
      ],
    });
    clusters.push({
      role, type: 'Exploratory', matchType: 'Broad',
      terms: [
        `${r} jobs hiring`,
        `${r} career opportunities`,
      ],
    });
  });

  return { clusters, negatives: STANDARD_NEGATIVES.slice() };
}

module.exports = { buildKeywords, STANDARD_NEGATIVES };
