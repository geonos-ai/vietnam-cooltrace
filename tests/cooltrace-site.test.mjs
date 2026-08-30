import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function compiledJavaScript() {
  const assetsDirectory = new URL("../dist/assets/", import.meta.url);
  const files = await readdir(assetsDirectory);
  const scripts = files.filter((file) => file.endsWith(".js"));
  assert.ok(scripts.length > 0, "expected a compiled JavaScript bundle");
  return (await Promise.all(scripts.map((file) => readFile(new URL(file, assetsDirectory), "utf8")))).join("\n");
}

test("builds the GEONOS Vietnam corporate site for GitHub Pages", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const bundle = await compiledJavaScript();
  assert.match(html, /<title>GEONOS Vietnam \| COOL:TRACE Cooling Intelligence<\/title>/);
  assert.match(
    html,
    /GEONOS Vietnam helps facility and portfolio teams prioritize cooling action through COOL:TRACE, an evidence-first cooling intelligence service\./,
  );
  assert.match(html, /og:title" content="GEONOS Vietnam \| COOL:TRACE Cooling Intelligence"/);
  assert.match(html, /https:\/\/geonos-ai\.github\.io\/vietnam-cooltrace\/og\.png/);
  assert.match(html, /src="\/vietnam-cooltrace\/assets\//);

  assert.match(bundle, /GEONOS Vietnam/);
  assert.match(bundle, /A GEONOS Vietnam service/);
  assert.match(bundle, /Turn cooling data into verified climate action\./);
  assert.match(bundle, /#\/services/);
  assert.match(bundle, /#\/cooltrace\/portfolio/);
  assert.match(bundle, /#\/cooltrace\/assets/);
  assert.match(bundle, /#\/cooltrace\/capital/);
  assert.match(bundle, /#\/cooltrace\/climate/);
  assert.match(bundle, /#\/insights/);
  assert.match(bundle, /#\/about/);
  assert.match(bundle, /Cooling portfolio screening/);
  assert.match(bundle, /Action and capital planning/);
  assert.match(bundle, /Climate stress assessment/);
  assert.match(bundle, /Measurement and verification/);
  assert.match(bundle, /Demonstration data · No verified emissions reductions are claimed/);
  assert.match(bundle, /Demo dataset · August 21, 2026/);
  assert.doesNotMatch(bundle, /GEONOS Infrastructure/);
});

test("preserves the COOL:TRACE interactive demonstration and evidence boundaries", async () => {
  const bundle = await compiledJavaScript();

  assert.match(bundle, /NASA POWER/);
  assert.match(bundle, /175\.717/);
  assert.match(bundle, /CT-008/);
  assert.match(bundle, /No customer, partner, field result or verified abatement is claimed/i);
  assert.match(bundle, /Preview data intake/);
  assert.match(bundle, /Two anchors first; conditional expansion to six/i);
  assert.match(bundle, /current evidence is closest to TRL 4/i);
  assert.match(bundle, /portfolio contracts covering.*3 pilot facilities/i);
  assert.match(bundle, /113\.6208/);
  assert.match(bundle, /62\.09664/);
  assert.match(bundle, /175\.71744/);
  assert.match(bundle, /No AI\/ML\/LLM or document-content parsing runs in this release/i);
  assert.match(bundle, /\/vietnam-cooltrace\/COOLTRACE_Competition_Dossier\.pdf/);
  assert.doesNotMatch(bundle, /codex-preview|react-loading-skeleton|Your site is taking shape/i);

  const source = await readFile(new URL("../app/portfolio-console.tsx", import.meta.url), "utf8");
  assert.match(source, /checks file metadata only/i);
  assert.match(source, /does not upload, parse, store, score or transmit file contents/i);
  assert.match(source, /CT-005 is excluded because.*diagnostic step/i);
  assert.doesNotMatch(source, /≥3\/6/);
});

test("ships the detailed competition dossier", async () => {
  const pdf = await readFile(new URL("../dist/COOLTRACE_Competition_Dossier.pdf", import.meta.url));
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.byteLength > 200_000, "expected a substantive multi-page dossier");
});
