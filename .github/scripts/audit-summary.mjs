// Non-blocking report of known-vulnerable packages (any severity).
// Usage: pnpm audit --prod --json | node .github/scripts/audit-summary.mjs "production"
// Writes a table to $GITHUB_STEP_SUMMARY and one ::warning:: per advisory. Always exits 0.
import { appendFileSync } from 'node:fs';

const label = process.argv[2] || 'production';
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const raw = Buffer.concat(chunks).toString('utf8').trim();

let data = null;
try {
  data = JSON.parse(raw);
} catch {
  console.log(`::warning title=Dependency audit (${label})::Could not read the audit output.`);
}

const advisories = Object.values(data?.advisories ?? {});
const rank = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
advisories.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));

const lines = [`### Vulnerable packages - ${label} (${advisories.length})`, ''];
if (advisories.length === 0) {
  lines.push('None found.');
} else {
  lines.push('| Severity | Package | Vulnerable | Patched | Advisory | Example path |', '|---|---|---|---|---|---|');
  for (const a of advisories) {
    const path = a.findings?.[0]?.paths?.[0] ?? '';
    const adv = a.github_advisory_id || a.id;
    lines.push(`| ${a.severity} | ${a.module_name} | ${a.vulnerable_versions} | ${a.patched_versions} | ${adv} | ${path} |`);
    console.log(`::warning title=${a.severity} (${label}): ${a.module_name}::${a.title} - patched in ${a.patched_versions} (${adv})`);
  }
}
const out = lines.join('\n') + '\n';
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + '\n');
