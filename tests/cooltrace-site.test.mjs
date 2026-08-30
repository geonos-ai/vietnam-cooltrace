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

test("builds the COOL:TRACE GitHub Pages experience", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const bundle = await compiledJavaScript();
  assert.match(html, /<title>GEONOS Infrastructure \| COOL:TRACE/);
  assert.match(html, /https:\/\/geonos-ai\.github\.io\/vietnam-cooltrace\/og\.png/);
  assert.match(html, /src="\/vietnam-cooltrace\/assets\//);
  assert.match(bundle, /Portfolio command center/);
  assert.match(bundle, /Fix the cooling assets that matter first/);
  assert.match(bundle, /Evidence-ranked asset queue/);
  assert.match(bundle, /One budget\. Two defensible decisions/);
  assert.match(bundle, /Push one asset into a hotter operating envelope/);
  assert.match(bundle, /NASA POWER/);
  assert.match(bundle, /175\.717/);
  assert.match(bundle, /Screened climate opportunity/);
  assert.match(bundle, /CT-008/);
  assert.match(bundle, /No customer, partner, field result or verified abatement is claimed/i);
  assert.match(bundle, /Preview data intake/);
  assert.match(bundle, /Trace the evidence\. Prioritize cooling action\. Prove what changed\./);
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
