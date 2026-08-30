import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  CLAIM_BOUNDARIES,
  CLIMATE_SCENARIOS,
  CLIMATE_STRESS_TEST,
  FOCUSED_MV_CASE,
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

const moneyFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const numberFormatter = new Intl.NumberFormat("en-US");

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
  type: string;
  sizeBytes: number;
  lastModified: number;
  state: "ready" | "unsupported" | "empty" | "too_large";
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
      annualElectricitySavingVnd:
        result.annualElectricitySavingVnd + action.annualElectricitySavingVnd,
    }),
    {
      actions: [],
      totalCostVnd: 0,
      totalPotentialTco2e: 0,
      annualEnergySavingKwh: 0,
      annualElectricitySavingVnd: 0,
    },
  );
}

function priorityLabel(priority: PortfolioAction["priority"]) {
  return {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    review: "Review",
  }[priority];
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
  return {
    prioritize: "Prioritize now",
    schedule: "Schedule diagnosis",
    measure: "Measure outcome",
    monitor: "Monitor",
    close_evidence_gap: "Close evidence gap",
  }[decision];
}

function validateFile(file: File): LocalFileRecord {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : "";
  let state: LocalFileRecord["state"] = "ready";
  if (!FILE_EXTENSIONS.has(extension)) state = "unsupported";
  else if (file.size === 0) state = "empty";
  else if (file.size > 25 * 1024 * 1024) state = "too_large";

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    extension,
    type: file.type || "Type not reported",
    sizeBytes: file.size,
    lastModified: file.lastModified,
    state,
  };
}

function fileStateLabel(state: LocalFileRecord["state"]) {
  return {
    ready: "Metadata ready",
    unsupported: "Unsupported type",
    empty: "Empty file",
    too_large: "Over 25 MB",
  }[state];
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
    alertHoursAbove90PctNameplate:
      lower.alertHoursAbove90PctNameplate +
      (upper.alertHoursAbove90PctNameplate - lower.alertHoursAbove90PctNameplate) * share,
    energyChangePct: lower.energyChangePct + (upper.energyChangePct - lower.energyChangePct) * share,
  };
}

function SiteGlyph({ sector }: { sector: (typeof PORTFOLIO_SITES)[number]["sector"] }) {
  const labels = {
    cold_storage: "CS",
    hotel: "HT",
    food_processing: "FP",
    supermarket: "SM",
  };
  return <span className={`pc-site-glyph pc-site-glyph-${sector}`}>{labels[sector]}</span>;
}

export function PortfolioConsole({ onOpenReport }: PortfolioConsoleProps) {
  const [selectedCaseId, setSelectedCaseId] = useState("CT-008");
  const [siteFilter, setSiteFilter] = useState("all");
  const [budgetMillion, setBudgetMillion] = useState(25);
  const [lens, setLens] = useState<OptimizationLens>("climate");
  const [heatDelta, setHeatDelta] = useState(2);
  const [ingestOpen, setIngestOpen] = useState(false);
  const [localFiles, setLocalFiles] = useState<LocalFileRecord[]>([]);
  const [metadataReviewed, setMetadataReviewed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  const selectedAction =
    PORTFOLIO_ACTIONS.find((action) => action.caseId === selectedCaseId) ?? PORTFOLIO_ACTIONS[0];
  const selectedSite = PORTFOLIO_SITES.find((site) => site.siteId === selectedAction.siteId);
  const filteredActions =
    siteFilter === "all"
      ? PORTFOLIO_ACTIONS
      : PORTFOLIO_ACTIONS.filter((action) => action.siteId === siteFilter);
  const optimized = useMemo(
    () => optimizeActionPortfolio(ACTION_READY_ACTIONS, budgetMillion * 1_000_000, lens),
    [budgetMillion, lens],
  );
  const packagePayback =
    optimized.annualElectricitySavingVnd > 0
      ? (optimized.totalCostVnd / optimized.annualElectricitySavingVnd) * 12
      : null;
  const readyFileCount = localFiles.filter((file) => file.state === "ready").length;
  const climateStress = useMemo(() => interpolateStress(heatDelta), [heatDelta]);

  useEffect(() => {
    if (!ingestOpen) return;
    drawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIngestOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ingestOpen]);

  function chooseSite(siteId: string) {
    setSiteFilter(siteId);
    if (siteId !== "all") {
      const firstAsset = PORTFOLIO_ACTIONS.find((action) => action.siteId === siteId);
      if (firstAsset) setSelectedCaseId(firstAsset.caseId);
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const records = Array.from(event.target.files ?? []).map(validateFile);
    setLocalFiles(records);
    setMetadataReviewed(false);
  }

  function openReport() {
    if (onOpenReport) {
      onOpenReport();
      return;
    }
    window.open(
      `${import.meta.env.BASE_URL}COOLTRACE_Competition_Dossier.pdf`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="pc-app">
      <header className="pc-topbar">
        <a className="pc-brand" href="#portfolio-command" aria-label="GEONOS Infrastructure COOL TRACE home">
          <span className="pc-brand-mark" aria-hidden="true">G</span>
          <span>
            <b>GEONOS Infrastructure</b>
            <small>COOL:TRACE</small>
          </span>
        </a>
        <nav className="pc-primary-nav" aria-label="Product navigation">
          <a className="pc-nav-active" href="#portfolio-command">Portfolio</a>
          <a href="#asset-register">Assets</a>
          <a href="#capital-planner">Capital planner</a>
          <a href="#scenario-lab">Scenario lab</a>
          <a href="#public-intelligence">Climate intelligence</a>
        </nav>
        <div className="pc-topbar-actions">
          <button className="pc-button pc-button-quiet" type="button" onClick={() => setIngestOpen(true)}>
            Preview data intake
          </button>
          <button className="pc-button pc-button-dark" type="button" onClick={openReport}>
            Pre-generated dossier
          </button>
        </div>
      </header>

      <div className="pc-workspace-bar">
        <div>
          <span className="pc-eyebrow">Demonstration workspace</span>
          <strong>Southern Vietnam cooling portfolio</strong>
        </div>
        <div className="pc-workspace-meta" aria-label="Workspace dataset counts">
          <span><b>5</b> sites</span>
          <span><b>10</b> assets</span>
          <span><b>23</b> records</span>
          <span><b>5,472</b> intervals</span>
          <span className="pc-live-dot">Data as of {PORTFOLIO_SUMMARY.dataAsOf}</span>
        </div>
      </div>

      <main className="pc-main">
        <section className="pc-command" id="portfolio-command" aria-labelledby="pc-command-title">
          <div className="pc-command-heading">
            <div>
              <p className="pc-kicker">Portfolio command center</p>
              <h1 id="pc-command-title">Fix the cooling assets that matter first.</h1>
              <p className="pc-lede">
                This preloaded demonstration shows how COOL:TRACE would join utility, maintenance, refrigerant,
                and public weather records into an evidence-gated action queue and M&amp;V workflow.
              </p>
            </div>
            <div className="pc-boundary-note">
              <b>Evidence boundary</b>
              <p>
                Facility records are deterministic demonstration scenarios. Public climate and policy data
                are source-traceable. No customer, partner, field result or verified abatement is claimed.
                No AI/ML/LLM or document-content parsing runs in this release, and no customer data are persisted.
              </p>
            </div>
          </div>

          <div className="pc-kpi-grid" aria-label="Portfolio key performance indicators">
            <article className="pc-kpi pc-kpi-emphasis">
              <span>Screened climate opportunity</span>
              <strong>{PORTFOLIO_SUMMARY.summedCaseLevelPotentialTco2e.toFixed(3)}</strong>
              <small>tCO₂e potential · unverified</small>
              <p>
                {PORTFOLIO_SUMMARY.quantifiedDirectPotentialTco2eUnrounded.toFixed(4)} direct + {PORTFOLIO_SUMMARY.quantifiedIndirectPotentialTco2Unrounded.toFixed(5)} indirect = {PORTFOLIO_SUMMARY.summedCaseLevelPotentialTco2eUnrounded.toFixed(5)}; displayed total rounded to 175.717, not avoided emissions.
              </p>
            </article>
            <article className="pc-kpi">
              <span>Illustrative energy opportunity</span>
              <strong>{numberFormatter.format(PORTFOLIO_SUMMARY.illustrativeAnnualEnergySavingKwh)}</strong>
              <small>kWh / year · modeled</small>
              <p>{PORTFOLIO_SUMMARY.illustrativePortfolioEnergyOpportunityPct.toFixed(2)}% of reference portfolio energy.</p>
            </article>
            <article className="pc-kpi">
              <span>Scenario annual value</span>
              <strong>₫{formatVndMillions(PORTFOLIO_SUMMARY.illustrativeAnnualElectricitySavingVnd)}</strong>
              <small>at ₫2,100 / kWh</small>
              <p>Energy value only; excludes refrigerant, downtime, tax and financing.</p>
            </article>
            <article className="pc-kpi">
              <span>Decision queue</span>
              <strong>2 critical</strong>
              <small>CT-002 · CT-008</small>
              <p>One additional asset, CT-010, remains blocked by missing mass evidence.</p>
            </article>
          </div>

          <div className="pc-sites-panel">
            <div className="pc-section-heading pc-section-heading-compact">
              <div>
                <p className="pc-kicker">Facility network</p>
                <h2>Five representative operating contexts</h2>
              </div>
              <button
                type="button"
                className={`pc-filter-button ${siteFilter === "all" ? "is-active" : ""}`}
                onClick={() => chooseSite("all")}
                aria-pressed={siteFilter === "all"}
              >
                All sites
              </button>
            </div>
            <div className="pc-site-grid">
              {PORTFOLIO_SITES.map((site) => (
                <button
                  type="button"
                  key={site.siteId}
                  className={`pc-site-card ${siteFilter === site.siteId ? "is-selected" : ""}`}
                  onClick={() => chooseSite(site.siteId)}
                  aria-pressed={siteFilter === site.siteId}
                >
                  <span className="pc-site-card-top">
                    <SiteGlyph sector={site.sector} />
                    <span>{site.provinceCity}</span>
                  </span>
                  <strong>{site.labelEn}</strong>
                  <span className="pc-site-statline">
                    <span>{site.assetCount} assets</span>
                    <span>{site.maintenanceRecordCount} records</span>
                  </span>
                  <span className="pc-site-opportunity">
                    <b>{site.potentialTotalTco2e === null ? "Evidence gap" : `${site.potentialTotalTco2e.toFixed(3)} tCO₂e`}</b>
                    <small>{site.potentialTotalTco2e === null ? "not quantified" : "screened potential"}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="pc-assets-section" id="asset-register" aria-labelledby="pc-assets-title">
          <div className="pc-section-heading">
            <div>
              <p className="pc-kicker">Action intelligence</p>
              <h2 id="pc-assets-title">Evidence-ranked asset queue</h2>
              <p>Priorities combine maintenance sequence, refrigerant mass evidence, energy context and weather normalization.</p>
            </div>
            <div className="pc-section-status">
              <span className="pc-status-dot" />
              {filteredActions.length} assets in view
            </div>
          </div>

          <div className="pc-asset-layout">
            <div className="pc-table-card">
              <div className="pc-table-scroll">
                <table className="pc-asset-table">
                  <caption className="pc-sr-only">Portfolio assets ranked by evidence and operational priority</caption>
                  <thead>
                    <tr>
                      <th scope="col">Rank / asset</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Evidence state</th>
                      <th scope="col" className="pc-number-cell">Screened tCO₂e</th>
                      <th scope="col" className="pc-number-cell">Action cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActions.map((action) => (
                      <tr key={action.caseId} className={selectedCaseId === action.caseId ? "is-selected" : ""}>
                        <td>
                          <button
                            type="button"
                            className="pc-asset-select"
                            onClick={() => setSelectedCaseId(action.caseId)}
                            aria-current={selectedCaseId === action.caseId ? "true" : undefined}
                          >
                            <span className="pc-rank">{String(action.portfolioRank).padStart(2, "0")}</span>
                            <span>
                              <b>{action.caseId}</b>
                              <small>{action.assetNameEn}</small>
                            </span>
                          </button>
                        </td>
                        <td><span className={`pc-priority pc-priority-${action.priority}`}>{priorityLabel(action.priority)}</span></td>
                        <td><span className={`pc-evidence pc-evidence-${action.evidenceState}`}>{evidenceLabel(action.evidenceState)}</span></td>
                        <td className="pc-number-cell">
                          {action.totalPotentialTco2e === null ? <span className="pc-muted">Blocked</span> : action.totalPotentialTco2e.toFixed(3)}
                        </td>
                        <td className="pc-number-cell">
                          {action.actionCostVnd === null ? <span className="pc-muted">Not scoped</span> : `₫${formatVndMillions(action.actionCostVnd)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pc-table-footer">
                <span>Ranking is deterministic and inspectable.</span>
                <span>Potential ≠ avoided emissions</span>
              </div>
            </div>

            <aside className="pc-asset-detail" aria-live="polite">
              <div className="pc-detail-head">
                <div>
                  <span className={`pc-priority pc-priority-${selectedAction.priority}`}>{priorityLabel(selectedAction.priority)}</span>
                  <span className="pc-case-id">{selectedAction.caseId} · {selectedAction.assetId}</span>
                </div>
                <span className="pc-confidence">{Math.round(selectedAction.evidenceConfidence * 100)}% evidence confidence</span>
              </div>
              <h3>{selectedAction.assetNameEn}</h3>
              <p className="pc-detail-site">{selectedSite?.labelEn} · {selectedSite?.provinceCity} · {selectedAction.refrigerant}</p>

              <div className="pc-detail-metrics">
                <div>
                  <span>Total potential</span>
                  <b>{selectedAction.totalPotentialTco2e === null ? "Not quantified" : `${selectedAction.totalPotentialTco2e.toFixed(3)} tCO₂e`}</b>
                </div>
                <div>
                  <span>Energy screen</span>
                  <b>{numberFormatter.format(selectedAction.annualEnergySavingKwh)} kWh/yr</b>
                </div>
                <div>
                  <span>Reference cost</span>
                  <b>{selectedAction.actionCostVnd === null ? "Not documented" : `₫${formatVndMillions(selectedAction.actionCostVnd)}`}</b>
                </div>
                <div>
                  <span>Energy-only payback</span>
                  <b>{selectedAction.energyOnlySimplePaybackMonths === null ? "Not comparable" : `${selectedAction.energyOnlySimplePaybackMonths} months`}</b>
                </div>
                <div>
                  <span>Direct potential</span>
                  <b>{selectedAction.directPotentialTco2e === null ? "Evidence blocked" : `${selectedAction.directPotentialTco2e.toFixed(3)} tCO₂e`}</b>
                </div>
                <div>
                  <span>Indirect potential</span>
                  <b>{selectedAction.indirectPotentialTco2.toFixed(3)} tCO₂</b>
                </div>
              </div>

              <div className="pc-finding">
                <span>System finding</span>
                <p>{selectedAction.finding}</p>
              </div>
              <div className="pc-action-box">
                <span>{decisionLabel(selectedAction.decision)}</span>
                <p>{selectedAction.candidateAction}</p>
              </div>

              <div className="pc-evidence-ledger">
                <div className="pc-mini-heading">
                  <b>Evidence ledger</b>
                  <span>{selectedAction.evidenceRecordIds.length} linked records</span>
                </div>
                <div className="pc-record-chips">
                  {selectedAction.evidenceRecordIds.map((recordId) => <span key={recordId}>{recordId}</span>)}
                  {selectedAction.costSourceRecordId && <span className="pc-cost-chip">Cost: {selectedAction.costSourceRecordId}</span>}
                </div>
              </div>

              <div className="pc-mv-gate">
                <div className="pc-mini-heading">
                  <b>M&amp;V gate</b>
                  <span className={selectedAction.caseId === FOCUSED_MV_CASE.caseId ? "pc-gate-demo" : "pc-gate-pending"}>
                    {selectedAction.caseId === FOCUSED_MV_CASE.caseId ? "Demo window available" : "Verification pending"}
                  </span>
                </div>
                <ol>
                  <li className={selectedAction.evidenceState === "evidence_gap" ? "is-blocked" : "is-complete"}>Evidence assembled</li>
                  <li className={selectedAction.actionCostVnd === null ? "is-pending" : "is-complete"}>Action scope documented</li>
                  <li className={selectedAction.evidenceState.includes("closed") ? "is-complete" : "is-pending"}>Action record linked</li>
                  <li className="is-pending">90-day normalized verification</li>
                </ol>
                {selectedAction.caseId === FOCUSED_MV_CASE.caseId && (
                  <p className="pc-mv-result">
                    Demonstration comparison: {numberFormatter.format(FOCUSED_MV_CASE.modeledAvoidedEnergyKwh)} kWh modeled,
                    {` ${FOCUSED_MV_CASE.modeledEnergyReductionPct}%`} reduction, ±{FOCUSED_MV_CASE.assumedRelativeUncertaintyPct}% scenario uncertainty.
                    Not field verified or IPMVP certified.
                  </p>
                )}
              </div>

              <p className="pc-claim-boundary"><b>Claim boundary:</b> {selectedAction.claimBoundary}</p>
            </aside>
          </div>
        </section>

        <section className="pc-operating-grid" aria-label="Data coverage and operating workflow">
          <article className="pc-panel pc-coverage-panel">
            <div className="pc-section-heading pc-section-heading-compact">
              <div>
                <p className="pc-kicker">Data readiness</p>
                <h2>Coverage before confidence</h2>
              </div>
              <button type="button" className="pc-link-button" onClick={() => setIngestOpen(true)}>Preview data intake</button>
            </div>
            <div className="pc-coverage-list">
              {[
                ["Asset registry", "10 / 10", 100, "Facility demo"],
                ["Maintenance records", "23 / 23", 100, "Facility demo"],
                ["Public weather anchors", "2 / 5 sites", 40, "NASA POWER"],
                ["15-minute meter series", "1 / 10 assets", 10, "5,472 intervals"],
                ["Quantified screens", "9 / 10", 90, "1 evidence gap"],
              ].map(([label, value, coverage, source]) => (
                <div className="pc-coverage-row" key={String(label)}>
                  <div><b>{label}</b><span>{source}</span></div>
                  <div className="pc-coverage-bar" aria-hidden="true"><span style={{ width: `${coverage}%` }} /></div>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <p className="pc-panel-note">Missing data lowers claimability; it does not silently become a model estimate.</p>
          </article>

          <article className="pc-panel pc-workflow-panel">
            <div className="pc-section-heading pc-section-heading-compact">
              <div>
                <p className="pc-kicker">Target operating workflow</p>
                <h2>From record to verified decision</h2>
              </div>
            </div>
            <ol className="pc-workflow">
              <li><span>01</span><div><b>Connect</b><p>Meter exports, asset registers, work orders and service PDFs.</p></div></li>
              <li><span>02</span><div><b>Resolve</b><p>Join records to one asset identity and preserve source lineage.</p></div></li>
              <li><span>03</span><div><b>Contextualize</b><p>Separate heat and throughput load from actionable degradation.</p></div></li>
              <li><span>04</span><div><b>Prioritize</b><p>Issue an evidence-linked action package within the available budget.</p></div></li>
              <li><span>05</span><div><b>Verify</b><p>Lock the baseline, guard temperature compliance and measure outcome.</p></div></li>
            </ol>
          </article>
        </section>

        <section className="pc-planner" id="capital-planner" aria-labelledby="pc-planner-title">
          <div className="pc-section-heading">
            <div>
              <p className="pc-kicker">Capital planner</p>
              <h2 id="pc-planner-title">One budget. Two defensible decisions.</h2>
              <p>Exhaustive optimization tests every subset of the five action-ready cases—32 packages, no hidden heuristic.</p>
            </div>
            <span className="pc-model-badge">Deterministic optimizer · 5 actions</span>
          </div>

          <div className="pc-planner-grid">
            <div className="pc-planner-controls">
              <fieldset className="pc-lens-control">
                <legend>Decision lens</legend>
                <button type="button" className={lens === "climate" ? "is-active" : ""} onClick={() => setLens("climate")} aria-pressed={lens === "climate"}>
                  <span>Climate exposure</span>
                  <small>Maximize screened tCO₂e potential</small>
                </button>
                <button type="button" className={lens === "cash" ? "is-active" : ""} onClick={() => setLens("cash")} aria-pressed={lens === "cash"}>
                  <span>Cash recovery</span>
                  <small>Maximize annual energy value</small>
                </button>
              </fieldset>

              <div className="pc-budget-control">
                <div><label htmlFor="pc-budget">Available action budget</label><output htmlFor="pc-budget">₫{budgetMillion}M</output></div>
                <input id="pc-budget" type="range" min="10" max="70" step="1" value={budgetMillion} onChange={(event) => setBudgetMillion(Number(event.target.value))} />
                <div className="pc-range-labels"><span>₫10M</span><span>₫70M</span></div>
              </div>

              <div className="pc-optimizer-method">
                <b>Current objective</b>
                <p>
                  {lens === "climate"
                    ? "Choose the feasible package with the largest combined direct + indirect screened potential."
                    : "Choose the feasible package with the largest annual electricity value at ₫2,100/kWh."}
                </p>
                <p>CT-005 is excluded because its ₫2.3M record is a diagnostic step, not a scope-matched repair cost. Equal scores prefer lower cost; exact ties retain fixed input order.</p>
              </div>
            </div>

            <div className="pc-package-result" aria-live="polite">
              <div className="pc-package-head">
                <div>
                  <span>Recommended package</span>
                  <h3>{optimized.actions.length === 0 ? "No action fits this budget" : optimized.actions.map((action) => action.caseId).join(" + ")}</h3>
                </div>
                <span className="pc-package-count">{optimized.actions.length} work order{optimized.actions.length === 1 ? "" : "s"}</span>
              </div>
              <div className="pc-package-metrics">
                <div><span>Reference cost</span><b>₫{formatVndMillions(optimized.totalCostVnd)}</b></div>
                <div><span>Screened potential</span><b>{optimized.totalPotentialTco2e.toFixed(3)} tCO₂e</b></div>
                <div><span>Annual energy</span><b>{numberFormatter.format(optimized.annualEnergySavingKwh)} kWh</b></div>
                <div><span>Energy-only payback</span><b>{packagePayback === null ? "—" : `${packagePayback.toFixed(2)} mo`}</b></div>
              </div>
              <div className="pc-package-actions">
                {optimized.actions.map((action) => (
                  <button type="button" key={action.caseId} onClick={() => { setSiteFilter("all"); setSelectedCaseId(action.caseId); document.getElementById("asset-register")?.scrollIntoView({ behavior: "smooth" }); }}>
                    <span><b>{action.caseId}</b><small>{action.assetNameEn}</small></span>
                    <span><b>₫{formatVndMillions(action.actionCostVnd ?? 0)}</b><small>{action.totalPotentialTco2e?.toFixed(3)} tCO₂e screened</small></span>
                  </button>
                ))}
              </div>
              <p className="pc-package-boundary">
                Recommendation uses demonstration invoice references and modeled energy expectations. It is a planning screen—not a quote, forecast, or verified outcome.
              </p>
            </div>
          </div>
        </section>

        <section className="pc-stress-lab" id="scenario-lab" aria-labelledby="pc-stress-title">
          <div className="pc-section-heading">
            <div>
              <p className="pc-kicker">Climate stress lab · CT-002</p>
              <h2 id="pc-stress-title">Push one asset into a hotter operating envelope.</h2>
              <p>Move the heat perturbation and inspect the deterministic common-period response. The slider is a sensitivity test—not a weather forecast.</p>
            </div>
            <span className="pc-model-badge">682-hour common period · 48 kW nameplate</span>
          </div>
          <div className="pc-stress-grid">
            <div className="pc-stress-control">
              <div className="pc-stress-readout">
                <span>Facility heat perturbation</span>
                <strong>+{heatDelta.toFixed(1)}°C</strong>
              </div>
              <input
                id="pc-heat-delta"
                aria-label="Facility heat perturbation in degrees Celsius"
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={heatDelta}
                onChange={(event) => setHeatDelta(Number(event.target.value))}
              />
              <div className="pc-range-labels"><span>Observed period</span><span>+3.0°C test</span></div>
              <div className="pc-stress-presets" aria-label="Heat stress presets">
                {[0, 1.5, 2, 3].map((delta) => (
                  <button type="button" key={delta} className={heatDelta === delta ? "is-active" : ""} onClick={() => setHeatDelta(delta)}>
                    +{delta.toFixed(1)}°C
                  </button>
                ))}
              </div>
              <p>{CLAIM_BOUNDARIES.climateScenarios}</p>
            </div>
            <div className="pc-stress-results" aria-live="polite">
              <article><span>Common-period energy</span><strong>{numberFormatter.format(Math.round(climateStress.energyKwh))} kWh</strong><small>+{climateStress.energyChangePct.toFixed(2)}% vs baseline</small></article>
              <article><span>Peak power</span><strong>{climateStress.peakPowerKw.toFixed(2)} kW</strong><small>{((climateStress.peakPowerKw / 48) * 100).toFixed(1)}% of nameplate</small></article>
              <article><span>Location-based Scope 2</span><strong>{climateStress.scope2Tco2.toFixed(3)} tCO₂</strong><small>2023 grid factor · model output</small></article>
              <article className={climateStress.alertHoursAbove90PctNameplate > 0 ? "is-warning" : ""}><span>Hours above 90% nameplate</span><strong>{climateStress.alertHoursAbove90PctNameplate.toFixed(2)} h</strong><small>{climateStress.alertHoursAbove90PctNameplate > 0 ? "Operational test required" : "Below alert threshold"}</small></article>
            </div>
            <div className="pc-stress-curve" aria-label="Energy response by heat perturbation">
              <div className="pc-mini-heading"><b>Response curve</b><span>fixed demo operating period</span></div>
              <div className="pc-stress-bars">
                {CLIMATE_STRESS_TEST.map((point) => (
                  <button type="button" key={point.deltaC} onClick={() => setHeatDelta(point.deltaC)} className={heatDelta === point.deltaC ? "is-active" : ""}>
                    <span style={{ height: `${48 + point.energyChangePct * 3.3}%` }} />
                    <b>{numberFormatter.format(Math.round(point.energyKwh))}</b>
                    <small>+{point.deltaC}°C</small>
                  </button>
                ))}
              </div>
              <p>Facility response is interpolated only between four deterministic stress points. It does not extrapolate beyond +3°C.</p>
            </div>
          </div>
        </section>

        <section className="pc-intelligence" id="public-intelligence" aria-labelledby="pc-intelligence-title">
          <div className="pc-section-heading">
            <div>
              <p className="pc-kicker">Public intelligence layer</p>
              <h2 id="pc-intelligence-title">Climate stress and policy, with scope intact.</h2>
              <p>{numberFormatter.format(PUBLIC_DATA_FOOTPRINT.totalWeatherRows)} public weather rows support context—not claims about a facility sensor.</p>
            </div>
            <div className="pc-source-pill">NASA POWER · World Bank CCKP · Vietnam public sources</div>
          </div>

          <div className="pc-intelligence-grid">
            <article className="pc-panel pc-local-trends">
              <div className="pc-mini-heading"><b>Observed heat trend screens</b><span>1991–2025</span></div>
              {LOCAL_CLIMATE_SIGNALS.map((signal) => (
                <div className="pc-trend-row" key={signal.locationId}>
                  <div><b>{signal.label}</b><small>NASA POWER annual OLS screen</small></div>
                  <div><strong>+{signal.meanTemperatureTrendCPerDecade.toFixed(3)}°C</strong><span>per decade</span></div>
                  <div><strong>+{signal.cdd18TrendDegreeDaysPerDecade.toFixed(1)}</strong><span>CDD18 / decade</span></div>
                </div>
              ))}
              <p className="pc-panel-note">Historical association screen; not causal attribution or a site forecast.</p>
            </article>

            <article className="pc-panel pc-scenario-panel">
              <div className="pc-mini-heading"><b>National CMIP6 stress scenarios</b><span>Vietnam ensemble median</span></div>
              <div className="pc-scenario-table" role="table" aria-label="CMIP6 cooling stress scenarios">
                <div role="row" className="pc-scenario-head"><span role="columnheader">Scenario</span><span role="columnheader">CDD65F</span><span role="columnheader">Hot days &gt;35°C</span></div>
                {CLIMATE_SCENARIOS.map((scenario) => (
                  <div role="row" key={scenario.id}>
                    <span role="cell"><b>{scenario.label}</b><small>{scenario.period}</small></span>
                    <span role="cell"><b>{numberFormatter.format(scenario.coolingDegreeDaysBase65F)}</b><small>{scenario.cddChangeVsHistoricalPct === 0 ? "baseline" : `+${scenario.cddChangeVsHistoricalPct}%`}</small></span>
                    <span role="cell"><b>{scenario.hotDaysAbove35C}</b><small>days / year</small></span>
                  </div>
                ))}
              </div>
              <p className="pc-panel-note">Country-scale scenario context; not probability-weighted or downscaled engineering design data.</p>
            </article>
          </div>

          <div className="pc-policy-strip">
            <div className="pc-policy-lead">
              <span>Policy pressure</span>
              <b>{PUBLIC_FACTORS.vietnamGridFactor2023.valueTco2PerMwh} tCO₂/MWh</b>
              <small>2023 official location-based grid factor</small>
            </div>
            {POLICY_SIGNALS.slice(0, 4).map((signal) => (
              <article key={signal.id}>
                <span>{signal.referencePeriod}</span>
                <b>{signal.value}</b>
                <p>{signal.label}</p>
                <small>{signal.caveat}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="pc-pilot" aria-labelledby="pc-pilot-title">
          <div className="pc-pilot-copy">
            <span className="pc-track-label">Net Zero Challenge · Track 1 candidate</span>
            <h2 id="pc-pilot-title">Two anchors first; conditional expansion to six.</h2>
            <p>
              The official form category is Prototype/MVP (TRL 4–5); current evidence is closest to TRL 4. The figures below are proposed pilot targets,
              not achieved results. No facility is enrolled and no local implementation partner is represented.
            </p>
            <div className="pc-pilot-status"><b>Current status</b><span>0 / 2 anchor sites secured</span><span>No field claim</span></div>
          </div>
          <div className="pc-pilot-plan">
            <ol className="pc-phase-list">
              <li><span>Month 0–1</span><b>Secure two anchors</b><p>Contract roles, data rights, safety authority and baseline boundaries.</p></li>
              <li><span>Month 1–3</span><b>Anchor-site proof</b><p>Map records, run silent evaluation, complete technician review and pre-lock M&amp;V.</p></li>
              <li><span>Gate B</span><b>Pass, correct or stop</b><p>Expand only after data, safety, technician, partner, quotation and stricter baseline gates pass.</p></li>
              <li><span>Month 4–9</span><b>Conditional action + M&amp;V</b><p>Expand to up to six, complete approved work, review outcomes and test paid continuation.</p></li>
            </ol>
            <div className="pc-target-grid" aria-label="Proposed pilot targets">
              <div><strong>≥10%</strong><span>normalized cooling energy-intensity target</span></div>
              <div><strong>≥8%</strong><span>peak cooling kW reduction target</span></div>
              <div><strong>≥95%</strong><span>data-completeness target</span></div>
              <div><strong>≥2</strong><span>portfolio contracts covering ≥3 pilot facilities</span></div>
            </div>
            <p className="pc-target-boundary">Targets only · not achieved · M&amp;V minimum eligibility: holdout CV(RMSE) ≤25% and |NMBE| ≤10%; stricter Gate-B target: ≤20% and ≤5%; both reviewer-approved and pre-locked · temperature compliance must not worsen · direct refrigerant mass verified separately.</p>
          </div>
        </section>

        <section className="pc-final-cta" aria-label="COOL TRACE report and data actions">
          <div>
            <span className="pc-kicker">COOL:TRACE by GEONOS Infrastructure</span>
            <h2>Trace the evidence. Prioritize cooling action. Prove what changed.</h2>
            <p>Inspect the methods, evidence boundaries, calculations, and proposed Vietnam pilot before trusting the headline.</p>
          </div>
          <div>
            <button type="button" className="pc-button pc-button-light" onClick={() => setIngestOpen(true)}>Inspect local file metadata</button>
            <button type="button" className="pc-button pc-button-accent" onClick={openReport}>Open pre-generated dossier</button>
          </div>
        </section>
      </main>

      <footer className="pc-footer">
        <span>GEONOS Infrastructure · COOL:TRACE</span>
        <span>Demonstration product · no verified emissions claim</span>
        <a href="#portfolio-command">Back to portfolio</a>
      </footer>

      {ingestOpen && (
        <div className="pc-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIngestOpen(false); }}>
          <section className="pc-ingest-drawer" role="dialog" aria-modal="true" aria-labelledby="pc-ingest-title">
            <div className="pc-drawer-head">
              <div>
                <span className="pc-eyebrow">Local demonstration</span>
                <h2 id="pc-ingest-title">Preview facility data intake</h2>
              </div>
              <button ref={drawerCloseRef} type="button" className="pc-close-button" onClick={() => setIngestOpen(false)} aria-label="Close data connection panel">×</button>
            </div>
            <div className="pc-local-boundary">
              <b>Your files do not leave this browser.</b>
              <p>This demo checks file metadata only. It does not upload, parse, store, score or transmit file contents.</p>
            </div>

            <button type="button" className="pc-dropzone" onClick={() => fileInputRef.current?.click()}>
              <span className="pc-upload-symbol" aria-hidden="true">+</span>
              <b>Select local records</b>
              <span>CSV/XLSX meters · PDF work orders · JSON assets · PNG/JPG evidence</span>
              <small>Up to 25 MB per file · metadata validation only</small>
            </button>
            <input
              ref={fileInputRef}
              className="pc-sr-only"
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf,.json,.png,.jpg,.jpeg"
              onChange={handleFiles}
            />

            {localFiles.length > 0 && (
              <div className="pc-file-list" aria-live="polite">
                <div className="pc-mini-heading"><b>Local metadata</b><span>{readyFileCount} / {localFiles.length} ready</span></div>
                {localFiles.map((file) => (
                  <div className="pc-file-row" key={file.id}>
                    <span className="pc-file-ext">{file.extension || "?"}</span>
                    <div><b>{file.name}</b><small>{(file.sizeBytes / 1024).toFixed(1)} KB · modified {new Date(file.lastModified).toLocaleDateString()}</small></div>
                    <span className={`pc-file-state pc-file-state-${file.state}`}>{fileStateLabel(file.state)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pc-ingest-steps">
              <div className={localFiles.length ? "is-current" : ""}><span>1</span><b>Metadata check</b><small>Runs locally</small></div>
              <div className={metadataReviewed ? "is-current" : ""}><span>2</span><b>Schema mapping</b><small>Product workflow preview</small></div>
              <div><span>3</span><b>Portfolio staging</b><small>Requires production backend</small></div>
            </div>

            <div className="pc-drawer-actions">
              <button type="button" className="pc-button pc-button-quiet" onClick={() => { setLocalFiles([]); setMetadataReviewed(false); if (fileInputRef.current) fileInputRef.current.value = ""; }} disabled={localFiles.length === 0}>Clear local list</button>
              <button type="button" className="pc-button pc-button-dark" onClick={() => setMetadataReviewed(true)} disabled={readyFileCount === 0}>
                {metadataReviewed ? "Metadata reviewed locally" : "Review valid metadata"}
              </button>
            </div>
            {metadataReviewed && <p className="pc-review-result">Ready for schema mapping in a production deployment. No file content was read or uploaded in this demonstration.</p>}
          </section>
        </div>
      )}
    </div>
  );
}

export default PortfolioConsole;
