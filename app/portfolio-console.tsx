import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CLAIM_BOUNDARIES,
  CLIMATE_SCENARIOS,
  CLIMATE_STRESS_TEST,
  LOCAL_CLIMATE_SIGNALS,
  POLICY_SIGNALS,
  PORTFOLIO_ACTIONS,
  PORTFOLIO_SITES,
  PORTFOLIO_SUMMARY,
  PUBLIC_DATA_FOOTPRINT,
  PUBLIC_FACTORS,
  type PortfolioAction,
} from "./portfolio-data";
import "./portfolio-console.css";

const ACTION_READY_CASE_IDS = new Set(["CT-001", "CT-002", "CT-003", "CT-007", "CT-008"]);
const ACTION_READY_ACTIONS = PORTFOLIO_ACTIONS.filter((action) => ACTION_READY_CASE_IDS.has(action.caseId));
const FILE_EXTENSIONS = new Set(["csv", "xlsx", "xls", "pdf", "json", "png", "jpg", "jpeg"]);
const numberFormatter = new Intl.NumberFormat("en-US");
const compactNumberFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const moneyFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

type PrimaryRoute = "/" | "/services" | "/insights" | "/about";
type DemoTab = "portfolio" | "assets" | "capital" | "climate";
type AppRoute = PrimaryRoute | `/cooltrace/${DemoTab}`;
type DrawerMode = "intake" | "methods" | null;

export type OptimizationLens = "climate" | "cash";

export interface OptimizedPackage {
  actions: PortfolioAction[];
  totalCostVnd: number;
  totalPotentialTco2e: number;
  annualEnergySavingKwh: number;
  annualElectricitySavingVnd: number;
}

export interface PortfolioConsoleProps {
  onOpenReport?: () => void;
}

interface LocalFileRecord {
  id: string;
  name: string;
  extension: string;
  sizeBytes: number;
  lastModified: number;
  state: "ready" | "unsupported" | "empty" | "too_large";
}

const NAV_ITEMS: readonly { label: string; href: string; match: (route: AppRoute) => boolean }[] = [
  { label: "Home", href: "#/", match: (route) => route === "/" },
  { label: "Services", href: "#/services", match: (route) => route === "/services" },
  { label: "COOL:TRACE", href: "#/cooltrace/portfolio", match: (route) => route.startsWith("/cooltrace/") },
  { label: "Vietnam Insights", href: "#/insights", match: (route) => route === "/insights" },
  { label: "About", href: "#/about", match: (route) => route === "/about" },
];

const SERVICE_CARDS = [
  {
    number: "01",
    title: "Cooling portfolio screening",
    summary: "Locate priority sites and assets by connecting energy, maintenance, refrigerant, and operational records.",
    output: "Ranked opportunity map",
    review: "Meter exports, asset registers, service records, refrigerant logs, and operational context.",
    receive: "A portfolio-wide screen with evidence confidence, data gaps, and practical next steps.",
  },
  {
    number: "02",
    title: "Action and capital planning",
    summary: "Compare feasible work packages against budget, evidence quality, and operating constraints.",
    output: "Decision-ready action plan",
    review: "Action scope, invoice references, modeled impact, simple payback, and budget limits.",
    receive: "A transparent package of prioritized actions with the objective and exclusions made explicit.",
  },
  {
    number: "03",
    title: "Climate stress assessment",
    summary: "Test bounded heat scenarios for energy use, peak load, and operating headroom.",
    output: "Climate sensitivity brief",
    review: "Historical weather, public climate scenarios, equipment response, and nameplate constraints.",
    receive: "A sensitivity screen that separates scenario context from site-level engineering claims.",
  },
  {
    number: "04",
    title: "Measurement and verification",
    summary: "Define a baseline, connect work records, and evaluate post-action performance.",
    output: "Traceable verification record",
    review: "Baseline eligibility, intervention dates, operating conditions, and post-action observations.",
    receive: "A reviewable evidence trail with claim state, uncertainty, and verification boundaries.",
  },
] as const;

const DEMO_TABS: readonly { id: DemoTab; label: string }[] = [
  { id: "portfolio", label: "Portfolio" },
  { id: "assets", label: "Assets" },
  { id: "capital", label: "Capital plan" },
  { id: "climate", label: "Climate stress" },
];

const DEMO_ROUTE_HREFS: Record<DemoTab, string> = {
  portfolio: "#/cooltrace/portfolio",
  assets: "#/cooltrace/assets",
  capital: "#/cooltrace/capital",
  climate: "#/cooltrace/climate",
};

function parseRoute(): AppRoute {
  const route = window.location.hash.replace(/^#/, "") || "/";
  if (["/", "/services", "/insights", "/about"].includes(route)) return route as PrimaryRoute;
  if (route === "/cooltrace") return "/cooltrace/portfolio";
  if (["portfolio", "assets", "capital", "climate"].some((tab) => route === `/cooltrace/${tab}`)) return route as AppRoute;
  return "/";
}

function demoTabFromRoute(route: AppRoute): DemoTab {
  return route.startsWith("/cooltrace/") ? (route.split("/").pop() as DemoTab) : "portfolio";
}

function formatVndMillions(value: number) {
  return `${moneyFormatter.format(value / 1_000_000)}M`;
}

function actionScore(action: PortfolioAction, lens: OptimizationLens) {
  return lens === "climate" ? action.totalPotentialTco2e ?? 0 : action.annualElectricitySavingVnd;
}

/** Exhaustive subset search. Five comparable actions means only 32 candidate packages. */
export function optimizeActionPortfolio(
  actions: readonly PortfolioAction[],
  budgetVnd: number,
  lens: OptimizationLens,
): OptimizedPackage {
  let best: PortfolioAction[] = [];
  let bestScore = -1;
  let bestCost = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 2 ** actions.length; mask += 1) {
    const selected: PortfolioAction[] = [];
    let cost = 0;
    let score = 0;
    actions.forEach((action, index) => {
      if ((mask & (1 << index)) !== 0) {
        selected.push(action);
        cost += action.actionCostVnd ?? 0;
        score += actionScore(action, lens);
      }
    });
    if (cost <= budgetVnd && (score > bestScore || (score === bestScore && cost < bestCost))) {
      best = selected;
      bestScore = score;
      bestCost = cost;
    }
  }

  return best.reduce<OptimizedPackage>(
    (result, action) => ({
      actions: [...result.actions, action],
      totalCostVnd: result.totalCostVnd + (action.actionCostVnd ?? 0),
      totalPotentialTco2e: result.totalPotentialTco2e + (action.totalPotentialTco2e ?? 0),
      annualEnergySavingKwh: result.annualEnergySavingKwh + action.annualEnergySavingKwh,
      annualElectricitySavingVnd: result.annualElectricitySavingVnd + action.annualElectricitySavingVnd,
    }),
    { actions: [], totalCostVnd: 0, totalPotentialTco2e: 0, annualEnergySavingKwh: 0, annualElectricitySavingVnd: 0 },
  );
}

function interpolateStress(deltaC: number) {
  const upperIndex = CLIMATE_STRESS_TEST.findIndex((point) => point.deltaC >= deltaC);
  if (upperIndex <= 0) return CLIMATE_STRESS_TEST[0];
  const upper = CLIMATE_STRESS_TEST[upperIndex] ?? CLIMATE_STRESS_TEST[CLIMATE_STRESS_TEST.length - 1];
  const lower = CLIMATE_STRESS_TEST[upperIndex - 1] ?? CLIMATE_STRESS_TEST[0];
  const share = (deltaC - lower.deltaC) / (upper.deltaC - lower.deltaC || 1);
  return {
    deltaC,
    energyKwh: lower.energyKwh + (upper.energyKwh - lower.energyKwh) * share,
    scope2Tco2: lower.scope2Tco2 + (upper.scope2Tco2 - lower.scope2Tco2) * share,
    peakPowerKw: lower.peakPowerKw + (upper.peakPowerKw - lower.peakPowerKw) * share,
    alertHoursAbove90PctNameplate: lower.alertHoursAbove90PctNameplate + (upper.alertHoursAbove90PctNameplate - lower.alertHoursAbove90PctNameplate) * share,
    energyChangePct: lower.energyChangePct + (upper.energyChangePct - lower.energyChangePct) * share,
  };
}

function validateFile(file: File): LocalFileRecord {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : "";
  let state: LocalFileRecord["state"] = "ready";
  if (!FILE_EXTENSIONS.has(extension)) state = "unsupported";
  else if (file.size === 0) state = "empty";
  else if (file.size > 25 * 1024 * 1024) state = "too_large";
  return { id: `${file.name}-${file.size}-${file.lastModified}`, name: file.name, extension, sizeBytes: file.size, lastModified: file.lastModified, state };
}

function priorityLabel(priority: PortfolioAction["priority"]) {
  return { critical: "Critical", high: "High", medium: "Medium", low: "Low", review: "Review" }[priority];
}

function evidenceLabel(state: PortfolioAction["evidenceState"]) {
  return {
    closed_action_record: "Action recorded",
    closed_repair_modeled_follow_up: "Repair recorded · verify",
    open_follow_up: "Open follow-up",
    weather_normalized_monitor: "Weather normalized",
    closed_non_energy_action: "Reliability action",
    evidence_gap: "Evidence blocked",
  }[state];
}

function decisionLabel(decision: PortfolioAction["decision"]) {
  return { prioritize: "Prioritize now", schedule: "Schedule diagnosis", measure: "Measure outcome", monitor: "Monitor", close_evidence_gap: "Close evidence gap" }[decision];
}

function fileStateLabel(state: LocalFileRecord["state"]) {
  return { ready: "Metadata ready", unsupported: "Unsupported type", empty: "Empty file", too_large: "Over 25 MB" }[state];
}

function sectorLabel(sector: (typeof PORTFOLIO_SITES)[number]["sector"]) {
  return { cold_storage: "Cold storage", hotel: "Hospitality", food_processing: "Food processing", supermarket: "Retail" }[sector];
}

function SiteGlyph({ sector }: { sector: (typeof PORTFOLIO_SITES)[number]["sector"] }) {
  const labels = { cold_storage: "CS", hotel: "HT", food_processing: "FP", supermarket: "RT" };
  return <span className={`ct-site-glyph ct-site-glyph-${sector}`}>{labels[sector]}</span>;
}

function ArrowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return <a className={`ct-arrow-link ${className}`} href={href}><span>{children}</span><span aria-hidden="true">↗</span></a>;
}

function StatusBadge() {
  return <span className="ct-status-badge"><i aria-hidden="true" />Demonstration data · No verified emissions reductions are claimed</span>;
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <div className="ct-page-intro"><p className="ct-eyebrow">{eyebrow}</p><h1 tabIndex={-1} data-page-title>{title}</h1><p className="ct-page-lede">{children}</p></div>;
}

function Header({ route, menuOpen, setMenuOpen, openReport }: { route: AppRoute; menuOpen: boolean; setMenuOpen: (value: boolean) => void; openReport: () => void }) {
  return (
    <>
      <header className="ct-header">
        <div className="ct-header-inner">
          <a className="ct-brand" href="#/" aria-label="GEONOS Vietnam home"><span className="ct-brand-mark" aria-hidden="true">G</span><span className="ct-brand-copy"><strong>GEONOS</strong><small>VIETNAM</small></span></a>
          <nav className="ct-desktop-nav" aria-label="Main navigation">{NAV_ITEMS.map((item) => <a key={item.href} href={item.href} aria-current={item.match(route) ? "page" : undefined}>{item.label}</a>)}</nav>
          <div className="ct-header-actions">
            <button type="button" className="ct-text-button ct-desktop-only" onClick={openReport}>Open dossier</button>
            <a className="ct-button ct-button-dark ct-desktop-only" href="#/cooltrace/portfolio">Explore demo</a>
            <button type="button" className="ct-menu-button" aria-expanded={menuOpen} aria-controls="ct-mobile-nav" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
          </div>
        </div>
      </header>
      <div id="ct-mobile-nav" className={`ct-mobile-nav ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">{NAV_ITEMS.map((item, index) => <a key={item.href} href={item.href} aria-current={item.match(route) ? "page" : undefined}><span>0{index + 1}</span>{item.label}<b aria-hidden="true">↗</b></a>)}</nav>
        <div className="ct-mobile-actions"><button type="button" className="ct-button ct-button-outline" onClick={openReport}>Open dossier</button><a className="ct-button ct-button-accent" href="#/cooltrace/portfolio">Explore demo</a></div>
        <p>Cooling intelligence for Vietnam.</p>
      </div>
    </>
  );
}

function HomePage() {
  return (
    <main className="ct-page ct-home-page">
      <section className="ct-home-hero ct-wrap">
        <div className="ct-hero-copy">
          <p className="ct-eyebrow">A GEONOS Vietnam service</p>
          <h1 tabIndex={-1} data-page-title>Turn cooling data into verified climate action.</h1>
          <p>COOL:TRACE helps facilities in Vietnam identify high-priority cooling assets, plan investment, and verify energy and refrigerant outcomes—without losing the evidence trail.</p>
          <div className="ct-hero-actions"><a className="ct-button ct-button-accent" href="#/cooltrace/portfolio">Explore COOL:TRACE</a><a className="ct-button ct-button-outline-light" href="#/services">View services</a></div>
          <StatusBadge />
        </div>
        <div className="ct-product-preview" aria-label="COOL TRACE product preview">
          <div className="ct-preview-topline"><span><i />COOL:TRACE</span><small>Demo dataset · August 21, 2026</small></div>
          <div className="ct-preview-main"><p>Portfolio screen</p><div className="ct-preview-score"><strong>{PORTFOLIO_SUMMARY.summedCaseLevelPotentialTco2e.toFixed(3)}</strong><span>tCO₂e screened potential</span></div><div className="ct-preview-bars" aria-hidden="true">{[74, 57, 42, 30, 18].map((value, index) => <span key={value} style={{ width: `${value}%` }}><b>0{index + 1}</b></span>)}</div></div>
          <div className="ct-preview-footer"><span><b>{PORTFOLIO_SUMMARY.siteCount}</b> sites</span><span><b>{PORTFOLIO_SUMMARY.assetCount}</b> assets</span><span><b>{PORTFOLIO_SUMMARY.maintenanceRecordCount}</b> records</span><span className="ct-preview-next">Evidence linked <b>→</b></span></div>
        </div>
      </section>
      <div className="ct-sector-ribbon"><span>Designed for</span><b>Cold storage</b><i /><b>Food processing</b><i /><b>Hospitality</b><i /><b>Retail</b></div>
      <section className="ct-section ct-wrap">
        <div className="ct-section-heading ct-section-heading-row"><div><p className="ct-eyebrow">What we do</p><h2>One evidence trail. Four decisions.</h2></div><ArrowLink href="#/services">See all services</ArrowLink></div>
        <div className="ct-service-preview-grid">{SERVICE_CARDS.map((service) => <a href="#/services" className="ct-service-preview-card" key={service.number}><span>{service.number}</span><h3>{service.title}</h3><p>{service.summary}</p><b>{service.output}<i aria-hidden="true">↗</i></b></a>)}</div>
      </section>
      <section className="ct-vietnam-band"><div className="ct-wrap ct-vietnam-grid"><div><p className="ct-eyebrow">Vietnam climate context</p><h2>Cooling decisions cannot wait for perfect data.</h2><p>Public climate, grid, and policy records frame the pressure. COOL:TRACE keeps that context separate from facility evidence and verified results.</p><ArrowLink href="#/insights" className="ct-arrow-link-light">Explore Vietnam insights</ArrowLink></div><div className="ct-home-stat-grid"><article><strong>+0.220°C</strong><span>HCMC mean-temperature trend per decade</span><small>NASA POWER screen · 1991–2025</small></article><article><strong>+17.79%</strong><span>CDD65F mid-century scenario</span><small>SSP2–4.5 vs historical period</small></article><article><strong>0.6592</strong><span>tCO₂/MWh grid factor</span><small>Vietnam official 2023 factor</small></article></div></div></section>
      <section className="ct-home-cta ct-wrap"><div><p className="ct-eyebrow">COOL:TRACE by GEONOS Vietnam</p><h2>Trace the evidence. Prioritize action. Verify what changed.</h2></div><a className="ct-button ct-button-dark" href="#/cooltrace/portfolio">Open the interactive demo</a></section>
    </main>
  );
}

function ServicesPage() {
  const [openService, setOpenService] = useState(0);
  return (
    <main className="ct-page">
      <section className="ct-page-hero ct-wrap"><PageIntro eyebrow="Services" title="From scattered records to an action-ready cooling plan.">COOL:TRACE supports the full decision cycle: screen the portfolio, prioritize work, test climate stress, and verify outcomes.</PageIntro><div className="ct-page-hero-note"><span>04</span><p>Connected services<br /><b>One traceable workflow</b></p></div></section>
      <section className="ct-services-layout ct-wrap">
        <div className="ct-services-list">{SERVICE_CARDS.map((service, index) => { const isOpen = openService === index; return <article className={`ct-service-row ${isOpen ? "is-open" : ""}`} key={service.number}><button type="button" aria-expanded={isOpen} onClick={() => setOpenService(isOpen ? -1 : index)}><span>{service.number}</span><div><h2>{service.title}</h2><p>{service.summary}</p></div><b aria-hidden="true">{isOpen ? "−" : "+"}</b></button><div className="ct-service-details" hidden={!isOpen}><div><small>What we review</small><p>{service.review}</p></div><div><small>What you receive</small><p>{service.receive}</p></div><div><small>Primary output</small><strong>{service.output}</strong></div></div></article>; })}</div>
        <aside className="ct-services-aside"><p className="ct-eyebrow">Working principle</p><h2>Evidence first, claim second.</h2><p>Every output stays attached to its source, confidence, calculation basis, and current claim state.</p><div className="ct-claim-legend"><span><i className="is-screened" /><b>Screened potential</b><small>Opportunity screen</small></span><span><i className="is-modeled" /><b>Modeled estimate</b><small>Scenario, not forecast</small></span><span><i className="is-verified" /><b>Verified result</b><small>Measured evidence only</small></span></div><a href="#/cooltrace/portfolio" className="ct-button ct-button-accent">See COOL:TRACE in action</a></aside>
      </section>
      <section className="ct-workflow-section"><div className="ct-wrap"><div className="ct-section-heading"><p className="ct-eyebrow">How it works</p><h2>Five steps from record to decision.</h2></div><ol className="ct-workflow-rail">{[["01", "Connect", "Meters, assets, work orders"], ["02", "Resolve", "One identity and lineage"], ["03", "Contextualize", "Heat, load, and degradation"], ["04", "Prioritize", "Action within constraints"], ["05", "Verify", "Baseline and outcome"]].map(([number, title, text]) => <li key={number}><span>{number}</span><b>{title}</b><p>{text}</p></li>)}</ol></div></section>
    </main>
  );
}

function CoolTraceShell({ tab, children, openDrawer }: { tab: DemoTab; children: ReactNode; openDrawer: (mode: Exclude<DrawerMode, null>) => void }) {
  return (
    <main className="ct-page ct-demo-page">
      <section className="ct-demo-head ct-wrap"><div><p className="ct-eyebrow">COOL:TRACE by GEONOS Vietnam</p><h1 tabIndex={-1} data-page-title>Make every cooling decision traceable.</h1><p>Portfolio screening, asset priorities, capital planning, climate stress, and post-action verification—connected by one evidence trail.</p></div><div className="ct-demo-head-actions"><StatusBadge /><div><button type="button" className="ct-text-button" onClick={() => openDrawer("methods")}>Evidence &amp; methods</button><button type="button" className="ct-button ct-button-dark" onClick={() => openDrawer("intake")}>Preview data intake</button></div></div></section>
      <div className="ct-demo-nav-shell"><nav className="ct-demo-nav ct-wrap" aria-label="COOL TRACE demo views">{DEMO_TABS.map((item) => <a key={item.id} href={DEMO_ROUTE_HREFS[item.id]} aria-current={tab === item.id ? "page" : undefined}>{item.label}</a>)}<span>Demo dataset · August 21, 2026</span></nav></div>
      <section className="ct-demo-content ct-wrap">{children}</section>
    </main>
  );
}

function PortfolioView({ onChooseSite }: { onChooseSite: (siteId: string) => void }) {
  return (
    <><div className="ct-demo-view-heading"><div><p className="ct-eyebrow">Portfolio overview</p><h2>See where action is most urgent.</h2><p>A compact screen across five deterministic facility scenarios in Southern Vietnam.</p></div><span className="ct-model-chip">5 sites · 10 assets · 23 records</span></div>
      <div className="ct-kpi-grid"><article className="ct-kpi-card ct-kpi-primary"><span>Screened emissions potential</span><strong>{PORTFOLIO_SUMMARY.summedCaseLevelPotentialTco2e.toFixed(3)}</strong><small>tCO₂e · unverified opportunity screen</small></article><article className="ct-kpi-card"><span>Modeled annual savings</span><strong>{compactNumberFormatter.format(PORTFOLIO_SUMMARY.illustrativeAnnualEnergySavingKwh)}</strong><small>kWh / year · scenario estimate</small></article><article className="ct-kpi-card"><span>Action-ready cases</span><strong>{ACTION_READY_ACTIONS.length}</strong><small>of {PORTFOLIO_SUMMARY.assetCount} assets screened</small></article><article className="ct-kpi-card"><span>Evidence gap</span><strong>{PORTFOLIO_SUMMARY.evidenceGapAssetCount}</strong><small>asset blocked pending records</small></article></div>
      <div className="ct-portfolio-layout"><div className="ct-site-grid">{PORTFOLIO_SITES.map((site) => <button type="button" className="ct-site-card" key={site.siteId} onClick={() => onChooseSite(site.siteId)}><SiteGlyph sector={site.sector} /><span className="ct-site-card-copy"><small>{sectorLabel(site.sector)} · {site.provinceCity}</small><b>{site.labelEn}</b><em>{site.assetCount} asset{site.assetCount === 1 ? "" : "s"} · {site.maintenanceRecordCount} records</em></span><span className="ct-site-card-metric"><b>{site.potentialTotalTco2e === null ? "Review" : site.potentialTotalTco2e.toFixed(3)}</b><small>{site.potentialTotalTco2e === null ? "evidence gap" : "tCO₂e screened"}</small></span><i aria-hidden="true">→</i></button>)}</div><aside className="ct-coverage-card"><div><p className="ct-eyebrow">Evidence coverage</p><strong>90%</strong><span>9 of 10 assets quantified</span></div><div className="ct-donut" style={{ "--value": "90%" } as CSSProperties}><span>9/10</span></div><ul><li><i className="is-positive" />6 opportunity signals</li><li><i className="is-neutral" />3 no-anomaly or non-carbon</li><li><i className="is-gap" />1 evidence gap</li></ul><p>Potential is not avoided impact. A verified result is reserved for measured evidence.</p></aside></div>
    </>
  );
}

function AssetsView({ selectedCaseId, setSelectedCaseId, siteFilter, chooseSite }: { selectedCaseId: string; setSelectedCaseId: (caseId: string) => void; siteFilter: string; chooseSite: (siteId: string) => void }) {
  const selectedAction = PORTFOLIO_ACTIONS.find((action) => action.caseId === selectedCaseId) ?? PORTFOLIO_ACTIONS[0];
  const selectedSite = PORTFOLIO_SITES.find((site) => site.siteId === selectedAction.siteId);
  const filteredActions = siteFilter === "all" ? PORTFOLIO_ACTIONS : PORTFOLIO_ACTIONS.filter((action) => action.siteId === siteFilter);
  return (
    <><div className="ct-demo-view-heading ct-demo-view-heading-tools"><div><p className="ct-eyebrow">Asset priorities</p><h2>Move from signal to next step.</h2><p>Select an asset to inspect the evidence, decision, and claim boundary.</p></div><label className="ct-select-label">Facility<select value={siteFilter} onChange={(event) => chooseSite(event.target.value)}><option value="all">All five sites</option>{PORTFOLIO_SITES.map((site) => <option key={site.siteId} value={site.siteId}>{site.labelEn}</option>)}</select></label></div>
      <div className="ct-assets-layout"><div className="ct-asset-list" role="table" aria-label="Cooling asset priorities"><div className="ct-asset-list-head" role="row"><span>Rank / asset</span><span>Priority</span><span>Screened potential</span><span>Decision</span></div>{filteredActions.map((action) => <button type="button" role="row" key={action.caseId} className={selectedAction.caseId === action.caseId ? "is-selected" : ""} onClick={() => setSelectedCaseId(action.caseId)}><span role="cell"><b>{String(action.portfolioRank).padStart(2, "0")}</b><span><strong>{action.assetNameEn}</strong><small>{action.caseId} · {action.refrigerant}</small></span></span><span role="cell"><em className={`ct-priority ct-priority-${action.priority}`}>{priorityLabel(action.priority)}</em></span><span role="cell"><strong>{action.totalPotentialTco2e === null ? "—" : action.totalPotentialTco2e.toFixed(3)}</strong><small>{action.totalPotentialTco2e === null ? "unquantified" : "tCO₂e"}</small></span><span role="cell">{decisionLabel(action.decision)}<i aria-hidden="true">→</i></span></button>)}</div>
        <aside className="ct-asset-detail" aria-live="polite"><div className="ct-asset-detail-head"><div><small>{selectedAction.caseId} · {selectedSite?.provinceCity}</small><h3>{selectedAction.assetNameEn}</h3></div><em className={`ct-priority ct-priority-${selectedAction.priority}`}>{priorityLabel(selectedAction.priority)}</em></div><div className="ct-asset-detail-metrics"><span><small>Annual energy</small><b>{numberFormatter.format(selectedAction.referenceAnnualEnergyKwh)} kWh</b></span><span><small>Refrigerant</small><b>{selectedAction.refrigerant} · {selectedAction.nominalChargeKg} kg</b></span><span><small>Confidence</small><b>{Math.round(selectedAction.evidenceConfidence * 100)}%</b></span></div><div className="ct-detail-block"><small>What the records show</small><p>{selectedAction.finding}</p></div><div className="ct-detail-block ct-detail-action"><small>Recommended next step</small><p>{selectedAction.candidateAction}</p></div><div className="ct-evidence-row"><span><small>Evidence state</small><b>{evidenceLabel(selectedAction.evidenceState)}</b></span><span><small>Source records</small><b>{selectedAction.evidenceRecordIds.join(" · ")}</b></span></div><details><summary>Claim boundary</summary><p>{selectedAction.claimBoundary}</p></details></aside></div>
    </>
  );
}

function CapitalView({ budgetMillion, setBudgetMillion, lens, setLens, onChooseAction }: { budgetMillion: number; setBudgetMillion: (value: number) => void; lens: OptimizationLens; setLens: (lens: OptimizationLens) => void; onChooseAction: (caseId: string) => void }) {
  const optimized = useMemo(() => optimizeActionPortfolio(ACTION_READY_ACTIONS, budgetMillion * 1_000_000, lens), [budgetMillion, lens]);
  const packagePayback = optimized.annualElectricitySavingVnd > 0 ? (optimized.totalCostVnd / optimized.annualElectricitySavingVnd) * 12 : null;
  return (
    <><div className="ct-demo-view-heading"><div><p className="ct-eyebrow">Capital plan</p><h2>Build the best package within budget.</h2><p>The transparent optimizer tests all 32 subsets of five action-ready cases.</p></div><span className="ct-model-chip">Deterministic optimizer · no hidden heuristic</span></div>
      <div className="ct-capital-layout"><div className="ct-capital-controls"><fieldset><legend>Decision lens</legend><button type="button" className={lens === "climate" ? "is-active" : ""} aria-pressed={lens === "climate"} onClick={() => setLens("climate")}><b>Climate exposure</b><small>Maximize screened tCO₂e</small></button><button type="button" className={lens === "cash" ? "is-active" : ""} aria-pressed={lens === "cash"} onClick={() => setLens("cash")}><b>Cash recovery</b><small>Maximize annual energy value</small></button></fieldset><div className="ct-range-control"><div><label htmlFor="ct-budget">Available action budget</label><output htmlFor="ct-budget">₫{budgetMillion}M</output></div><input id="ct-budget" type="range" min="10" max="70" step="1" value={budgetMillion} onChange={(event) => setBudgetMillion(Number(event.target.value))} /><div><span>₫10M</span><span>₫70M</span></div></div><p>CT-005 is excluded because its ₫2.3M record is a diagnostic step, not a scope-matched repair cost. Equal scores prefer lower cost.</p></div>
        <div className="ct-package-card" aria-live="polite"><div className="ct-package-title"><span>Recommended package</span><h3>{optimized.actions.length ? optimized.actions.map((action) => action.caseId).join(" + ") : "No action fits this budget"}</h3><small>{optimized.actions.length} work order{optimized.actions.length === 1 ? "" : "s"}</small></div><div className="ct-package-metrics"><span><small>Reference cost</small><b>₫{formatVndMillions(optimized.totalCostVnd)}</b></span><span><small>Screened potential</small><b>{optimized.totalPotentialTco2e.toFixed(3)} tCO₂e</b></span><span><small>Annual energy</small><b>{numberFormatter.format(optimized.annualEnergySavingKwh)} kWh</b></span><span><small>Energy-only payback</small><b>{packagePayback === null ? "—" : `${packagePayback.toFixed(2)} mo`}</b></span></div><div className="ct-package-list">{optimized.actions.map((action) => <button type="button" key={action.caseId} onClick={() => onChooseAction(action.caseId)}><span><b>{action.caseId}</b><small>{action.assetNameEn}</small></span><span><b>₫{formatVndMillions(action.actionCostVnd ?? 0)}</b><small>{action.totalPotentialTco2e?.toFixed(3)} tCO₂e</small></span><i aria-hidden="true">→</i></button>)}</div><p>Modeled planning screen · not a quote, forecast, or verified outcome.</p></div></div>
    </>
  );
}

function ClimateView({ heatDelta, setHeatDelta }: { heatDelta: number; setHeatDelta: (value: number) => void }) {
  const climateStress = useMemo(() => interpolateStress(heatDelta), [heatDelta]);
  return (
    <><div className="ct-demo-view-heading"><div><p className="ct-eyebrow">Climate stress test · CT-002</p><h2>Test hotter operating conditions.</h2><p>Adjust a bounded heat perturbation and inspect the same 682-hour operating period.</p></div><span className="ct-model-chip">Sensitivity test · not a weather forecast</span></div>
      <div className="ct-climate-layout"><div className="ct-climate-control"><div><span>Facility heat perturbation</span><strong>+{heatDelta.toFixed(1)}°C</strong></div><input aria-label="Facility heat perturbation in degrees Celsius" type="range" min="0" max="3" step="0.5" value={heatDelta} onChange={(event) => setHeatDelta(Number(event.target.value))} /><div className="ct-range-labels"><span>Observed period</span><span>+3.0°C test</span></div><div className="ct-preset-buttons">{[0, 1.5, 2, 3].map((delta) => <button type="button" key={delta} className={heatDelta === delta ? "is-active" : ""} onClick={() => setHeatDelta(delta)}>+{delta.toFixed(1)}°C</button>)}</div><p>Interpolation is limited to four deterministic stress points and does not extrapolate beyond +3°C.</p></div>
        <div className="ct-climate-results" aria-live="polite"><article><span>Common-period energy</span><strong>{numberFormatter.format(Math.round(climateStress.energyKwh))} kWh</strong><small>+{climateStress.energyChangePct.toFixed(2)}% vs baseline</small></article><article><span>Peak power</span><strong>{climateStress.peakPowerKw.toFixed(2)} kW</strong><small>{((climateStress.peakPowerKw / 48) * 100).toFixed(1)}% of nameplate</small></article><article><span>Location-based Scope 2</span><strong>{climateStress.scope2Tco2.toFixed(3)} tCO₂</strong><small>2023 grid factor · model output</small></article><article className={climateStress.alertHoursAbove90PctNameplate > 0 ? "is-warning" : ""}><span>Hours above 90% nameplate</span><strong>{climateStress.alertHoursAbove90PctNameplate.toFixed(2)} h</strong><small>{climateStress.alertHoursAbove90PctNameplate > 0 ? "Operational review required" : "Below alert threshold"}</small></article></div>
        <div className="ct-response-card"><div><b>Energy response</b><span>fixed demonstration period</span></div><div className="ct-response-bars">{CLIMATE_STRESS_TEST.map((point) => <button type="button" key={point.deltaC} className={heatDelta === point.deltaC ? "is-active" : ""} onClick={() => setHeatDelta(point.deltaC)}><span style={{ height: `${46 + point.energyChangePct * 3.5}%` }} /><b>{numberFormatter.format(Math.round(point.energyKwh))}</b><small>+{point.deltaC}°C</small></button>)}</div></div></div>
    </>
  );
}

function InsightsPage({ openMethods }: { openMethods: () => void }) {
  return (
    <main className="ct-page">
      <section className="ct-page-hero ct-insights-hero ct-wrap"><PageIntro eyebrow="Vietnam Insights" title="Climate context for better cooling decisions.">Public climate, grid, and policy data help frame where cooling systems may face greater stress. They guide screening—not site-level forecasts.</PageIntro><div className="ct-insight-hero-stats"><span><strong>60,656</strong><small>public weather rows</small></span><span><strong>35 years</strong><small>historical daily context</small></span><button type="button" onClick={openMethods}>View sources &amp; methods ↗</button></div></section>
      <section className="ct-insight-metrics ct-wrap"><article><span>Observed screen</span><strong>+0.220°C</strong><p>HCMC mean-temperature trend per decade</p><small>NASA POWER · 1991–2025</small></article><article><span>Mid-century scenario</span><strong>+17.79%</strong><p>Vietnam CDD65F under SSP2–4.5</p><small>2040–2059 vs 1995–2014</small></article><article><span>Grid context</span><strong>0.6592</strong><p>tCO₂ per MWh of electricity</p><small>Official 2023 location-based factor</small></article></section>
      <section className="ct-insights-grid ct-wrap"><article className="ct-data-panel"><div className="ct-data-panel-head"><div><p className="ct-eyebrow">Observed context</p><h2>Heat trend screens</h2></div><span>1991–2025</span></div>{LOCAL_CLIMATE_SIGNALS.map((signal) => <div className="ct-trend-row" key={signal.locationId}><span><b>{signal.label}</b><small>Annual OLS screen</small></span><span><strong>+{signal.meanTemperatureTrendCPerDecade.toFixed(3)}°C</strong><small>per decade</small></span><span><strong>+{signal.cdd18TrendDegreeDaysPerDecade.toFixed(1)}</strong><small>CDD18 / decade</small></span></div>)}<p>Historical association screen; not causal attribution or a site forecast.</p></article>
        <article className="ct-data-panel"><div className="ct-data-panel-head"><div><p className="ct-eyebrow">Scenario context</p><h2>National CMIP6 screen</h2></div><span>Ensemble median</span></div><div className="ct-scenario-table"><div><span>Scenario</span><span>CDD65F</span><span>Hot days &gt;35°C</span></div>{CLIMATE_SCENARIOS.map((scenario) => <div key={scenario.id}><span><b>{scenario.label}</b><small>{scenario.period}</small></span><span><b>{numberFormatter.format(scenario.coolingDegreeDaysBase65F)}</b><small>{scenario.cddChangeVsHistoricalPct === 0 ? "baseline" : `+${scenario.cddChangeVsHistoricalPct}%`}</small></span><span><b>{scenario.hotDaysAbove35C}</b><small>days / year</small></span></div>)}</div><p>Country-scale scenarios; not probabilities or facility engineering conditions.</p></article></section>
      <section className="ct-policy-section"><div className="ct-wrap"><div className="ct-section-heading ct-section-heading-row"><div><p className="ct-eyebrow">Policy context</p><h2>Signals shaping the cooling transition.</h2></div><span className="ct-model-chip">Context only · no project attribution</span></div><div className="ct-policy-grid">{POLICY_SIGNALS.slice(0, 4).map((signal) => <article key={signal.id}><span>{signal.referencePeriod}</span><h3>{signal.value}</h3><p>{signal.label}</p><small>{signal.caveat}</small></article>)}</div></div></section>
    </main>
  );
}

function AboutPage({ openReport }: { openReport: () => void }) {
  return (
    <main className="ct-page">
      <section className="ct-about-hero ct-wrap"><PageIntro eyebrow="GEONOS Vietnam" title="Practical, evidence-first cooling intelligence for Vietnam.">We created COOL:TRACE to help operators, owners, and portfolio teams move from fragmented records to more confident cooling action.</PageIntro><div className="ct-about-manifesto"><span>Our principle</span><p>Better decisions begin by making the evidence—and its limits—impossible to miss.</p></div></section>
      <section className="ct-about-cards ct-wrap"><article><span>01</span><h2>Our focus</h2><p>Cooling performance, refrigerant risk, capital prioritization, climate resilience, and outcome verification.</p></article><article><span>02</span><h2>Current stage</h2><p>Prototype/MVP using reproducible demonstration records and source-linked public climate data; current evidence is closest to TRL 4.</p></article><article><span>03</span><h2>Pilot approach</h2><p>Begin with two anchor sites and expand only after data, safety, technician, and baseline gates are met.</p></article></section>
      <section className="ct-pilot-section"><div className="ct-wrap ct-pilot-layout"><div><p className="ct-eyebrow">Proposed Vietnam pilot</p><h2>Two anchors first; conditional expansion to six.</h2><p>The pilot plan is designed to correct or stop when data, safety, or verification conditions are not met.</p><div className="ct-pilot-status"><span>Current status</span><b>0 / 2 anchor sites secured</b><small>No customer, partner, field result or verified abatement is claimed.</small></div></div><ol>{[["M0–1", "Secure anchors", "Roles, data rights, safety, and baseline boundaries."], ["M1–3", "Prove at anchor sites", "Record mapping, silent evaluation, and technician review."], ["Gate B", "Pass, correct, or stop", "Data, safety, quotation, and baseline checks."], ["M4–9", "Conditional action + M&V", "Approved work, outcome review, and expansion decision."]].map(([time, title, text]) => <li key={time}><span>{time}</span><div><b>{title}</b><p>{text}</p></div></li>)}</ol></div><div className="ct-pilot-targets ct-wrap"><span><b>≥10%</b> normalized energy-intensity target</span><span><b>≥8%</b> peak cooling kW target</span><span><b>≥95%</b> data-completeness target</span><span><b>≥2</b> portfolio contracts covering ≥3 pilot facilities</span></div></section>
      <section className="ct-dossier-cta ct-wrap"><div><p className="ct-eyebrow">Competition dossier</p><h2>Review the model, calculations, pilot gates, and claim boundaries.</h2><p>Detailed methods and source notes are available in the full dossier.</p></div><button type="button" className="ct-button ct-button-accent" onClick={openReport}>Download dossier</button></section>
    </main>
  );
}

function Drawer({ mode, close, localFiles, setLocalFiles, metadataReviewed, setMetadataReviewed }: { mode: DrawerMode; close: () => void; localFiles: LocalFileRecord[]; setLocalFiles: (records: LocalFileRecord[]) => void; metadataReviewed: boolean; setMetadataReviewed: (value: boolean) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const readyFileCount = localFiles.filter((file) => file.state === "ready").length;
  useEffect(() => { if (mode) closeRef.current?.focus(); }, [mode]);
  if (!mode) return null;
  function handleFiles(event: ChangeEvent<HTMLInputElement>) { setLocalFiles(Array.from(event.target.files ?? []).map(validateFile)); setMetadataReviewed(false); }
  return (
    <div className="ct-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><aside className="ct-drawer" role="dialog" aria-modal="true" aria-labelledby="ct-drawer-title"><div className="ct-drawer-head"><div><p className="ct-eyebrow">{mode === "intake" ? "Local demonstration" : "COOL:TRACE transparency"}</p><h2 id="ct-drawer-title">{mode === "intake" ? "Preview facility data intake" : "Evidence & methods"}</h2></div><button ref={closeRef} type="button" onClick={close} aria-label="Close panel">×</button></div>
      {mode === "methods" ? <div className="ct-methods-content"><div className="ct-method-summary"><StatusBadge /><p>Facility records are reproducible scenarios. Public climate and policy data are source-linked. No AI/ML/LLM or document-content parsing runs in this release.</p></div><section><h3>Claim states</h3><div className="ct-claim-legend"><span><i className="is-screened" /><b>Screened potential</b><small>Opportunity screen</small></span><span><i className="is-modeled" /><b>Modeled estimate</b><small>Scenario, not forecast</small></span><span><i className="is-verified" /><b>Verified result</b><small>Measured evidence only</small></span></div></section><section><h3>Core boundaries</h3>{Object.entries(CLAIM_BOUNDARIES).map(([key, value]) => <details key={key}><summary>{key.replace(/([A-Z])/g, " $1")}</summary><p>{value}</p></details>)}</section><section><h3>Public source layer</h3>{PUBLIC_DATA_FOOTPRINT.sources.map((source) => <div className="ct-source-row" key={source.name}><b>{source.name}</b><span>{numberFormatter.format(source.rows)} records</span><p>{source.role}</p><small>{source.caveat}</small></div>)}</section><section><h3>Reference factors</h3><p><b>{PUBLIC_FACTORS.vietnamGridFactor2023.valueTco2PerMwh} tCO₂/MWh</b> · 2023 official location-based grid factor.</p><p><b>{PUBLIC_FACTORS.selectedGwpBasis}</b> · refrigerant mass-balance screening basis.</p></section></div>
      : <div className="ct-intake-content"><div className="ct-local-boundary"><b>Your files do not leave this browser.</b><p>This demo checks file metadata only. It does not upload, parse, store, score or transmit file contents.</p></div><button type="button" className="ct-dropzone" onClick={() => fileInputRef.current?.click()}><span>+</span><b>Select local records</b><p>CSV/XLSX meters · PDF work orders · JSON assets · PNG/JPG evidence</p><small>Up to 25 MB per file · metadata validation only</small></button><input ref={fileInputRef} className="ct-sr-only" type="file" multiple accept=".csv,.xlsx,.xls,.pdf,.json,.png,.jpg,.jpeg" onChange={handleFiles} />{localFiles.length > 0 && <div className="ct-file-list"><div><b>Local metadata</b><span>{readyFileCount} / {localFiles.length} ready</span></div>{localFiles.map((file) => <div className="ct-file-row" key={file.id}><span>{file.extension || "?"}</span><div><b>{file.name}</b><small>{(file.sizeBytes / 1024).toFixed(1)} KB · {new Date(file.lastModified).toLocaleDateString()}</small></div><em className={`is-${file.state}`}>{fileStateLabel(file.state)}</em></div>)}</div>}<div className="ct-ingest-steps"><span className={localFiles.length ? "is-current" : ""}><b>01</b>Metadata check<small>Runs locally</small></span><span className={metadataReviewed ? "is-current" : ""}><b>02</b>Schema mapping<small>Workflow preview</small></span><span><b>03</b>Portfolio staging<small>Production backend</small></span></div><div className="ct-drawer-actions"><button type="button" className="ct-button ct-button-outline" disabled={!localFiles.length} onClick={() => { setLocalFiles([]); setMetadataReviewed(false); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Clear list</button><button type="button" className="ct-button ct-button-dark" disabled={!readyFileCount} onClick={() => setMetadataReviewed(true)}>{metadataReviewed ? "Metadata reviewed locally" : "Review valid metadata"}</button></div>{metadataReviewed && <p className="ct-review-result">Ready for schema mapping in a production deployment. No file content was read or uploaded.</p>}</div>}
      </aside></div>
  );
}

function Footer({ openReport }: { openReport: () => void }) {
  return <footer className="ct-footer"><div className="ct-wrap ct-footer-grid"><div><a className="ct-brand ct-brand-footer" href="#/"><span className="ct-brand-mark">G</span><span className="ct-brand-copy"><strong>GEONOS</strong><small>VIETNAM</small></span></a><p>COOL:TRACE is a service of GEONOS Vietnam.</p></div><div><span>Navigate</span>{NAV_ITEMS.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</div><div><span>Resources</span><button type="button" onClick={openReport}>Competition dossier</button><a href="#/cooltrace/portfolio">Interactive demo</a><a href="#/insights">Data &amp; methods</a></div><div className="ct-footer-note"><span>Claim boundary</span><p>Demonstration data. No customer, partner, field result, or verified emissions reduction is claimed.</p></div></div><div className="ct-wrap ct-footer-bottom"><span>© 2026 GEONOS Vietnam</span><span>Cooling intelligence for Vietnam.</span><a href="#/">Back to top ↑</a></div></footer>;
}

export function PortfolioConsole({ onOpenReport }: PortfolioConsoleProps) {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("CT-008");
  const [siteFilter, setSiteFilter] = useState("all");
  const [budgetMillion, setBudgetMillion] = useState(25);
  const [lens, setLens] = useState<OptimizationLens>("climate");
  const [heatDelta, setHeatDelta] = useState(2);
  const [localFiles, setLocalFiles] = useState<LocalFileRecord[]>([]);
  const [metadataReviewed, setMetadataReviewed] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute());
      setMenuOpen(false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    window.setTimeout(() => document.querySelector<HTMLElement>("[data-page-title]")?.focus(), 0);
    const titles: Record<string, string> = { "/": "GEONOS Vietnam | COOL:TRACE Cooling Intelligence", "/services": "Services | GEONOS Vietnam", "/insights": "Vietnam Insights | GEONOS Vietnam", "/about": "About | GEONOS Vietnam" };
    document.title = route.startsWith("/cooltrace/") ? "COOL:TRACE Demo | GEONOS Vietnam" : titles[route] ?? titles["/"];
  }, [route]);
  useEffect(() => { if (!drawerMode) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawerMode(null); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [drawerMode]);

  function openReport() { if (onOpenReport) return onOpenReport(); window.open(`${import.meta.env.BASE_URL}COOLTRACE_Competition_Dossier.pdf`, "_blank", "noopener,noreferrer"); }
  function chooseSite(siteId: string, navigate = false) { setSiteFilter(siteId); if (siteId !== "all") { const firstAsset = PORTFOLIO_ACTIONS.find((action) => action.siteId === siteId); if (firstAsset) setSelectedCaseId(firstAsset.caseId); } if (navigate) window.location.hash = "/cooltrace/assets"; }
  function chooseAction(caseId: string) { setSelectedCaseId(caseId); setSiteFilter("all"); window.location.hash = "/cooltrace/assets"; }

  const demoTab = demoTabFromRoute(route);
  let content: ReactNode;
  if (route === "/") content = <HomePage />;
  else if (route === "/services") content = <ServicesPage />;
  else if (route === "/insights") content = <InsightsPage openMethods={() => setDrawerMode("methods")} />;
  else if (route === "/about") content = <AboutPage openReport={openReport} />;
  else content = <CoolTraceShell tab={demoTab} openDrawer={setDrawerMode}>{demoTab === "portfolio" && <PortfolioView onChooseSite={(siteId) => chooseSite(siteId, true)} />}{demoTab === "assets" && <AssetsView selectedCaseId={selectedCaseId} setSelectedCaseId={setSelectedCaseId} siteFilter={siteFilter} chooseSite={chooseSite} />}{demoTab === "capital" && <CapitalView budgetMillion={budgetMillion} setBudgetMillion={setBudgetMillion} lens={lens} setLens={setLens} onChooseAction={chooseAction} />}{demoTab === "climate" && <ClimateView heatDelta={heatDelta} setHeatDelta={setHeatDelta} />}</CoolTraceShell>;

  return <div className="ct-site"><Header route={route} menuOpen={menuOpen} setMenuOpen={setMenuOpen} openReport={openReport} />{content}<Footer openReport={openReport} /><Drawer mode={drawerMode} close={() => setDrawerMode(null)} localFiles={localFiles} setLocalFiles={setLocalFiles} metadataReviewed={metadataReviewed} setMetadataReviewed={setMetadataReviewed} /></div>;
}

export default PortfolioConsole;
