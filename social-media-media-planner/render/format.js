'use strict';

const DASH = '–'; // en-dash

function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtK(n) {
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) return Math.round(n / 1000) + 'K';
  return (n / 1e6).toFixed(2) + 'M';
}

function fmtClicks(n) {
  return Math.round(n).toLocaleString('en-US');
}

function fmtRangeK(low, high) {
  return `${fmtK(low)} ${DASH} ${fmtK(high)}`;
}

function fmtRangeClicks(low, high) {
  return `${fmtClicks(low)} ${DASH} ${fmtClicks(high)}`;
}

function fmtPct(n) {
  return (Math.round(n * 10) / 10).toFixed(1) + '%';
}

function fmtCpc(n) {
  return '$' + (Math.round(n * 100) / 100).toFixed(2);
}

module.exports = { fmtMoney, fmtK, fmtClicks, fmtRangeK, fmtRangeClicks, fmtPct, fmtCpc, DASH };
