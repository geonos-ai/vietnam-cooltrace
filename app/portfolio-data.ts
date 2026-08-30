/**
 * COOL:TRACE portfolio data used by the product UI.
 *
 * Source-of-truth files live in ../vietnam_data. Public climate/policy records
 * and deterministic facility demonstration records are deliberately kept in
 * separate provenance zones. Nothing in this module is a partner, customer,
 * pilot, field-validation, or verified-emissions claim.
 */

export type Priority = "critical" | "high" | "medium" | "low" | "review";

export type Decision =
  | "prioritize"
  | "schedule"
  | "measure"
  | "monitor"
  | "close_evidence_gap";

export type EvidenceState =
  | "closed_action_record"
  | "closed_repair_modeled_follow_up"
  | "open_follow_up"
  | "weather_normalized_monitor"
  | "closed_non_energy_action"
  | "evidence_gap";

export type CostBasis =
  | "completed_action_invoice"
  | "completed_repair_invoice"
  | "diagnostic_invoice_partial_scope"
  | "completed_non_energy_action_invoice"
  | "completed_maintenance_invoice_no_saving_claim"
  | "no_action_cost"
  | "future_cost_not_documented";

export type FacilityProvenance = "demonstration_scenario";
export type PublicProvenance = "public_source_or_deterministic_derivative";

export interface PortfolioSite {
  siteId: string;
  nameVi: string;
  labelEn: string;
  sector: "cold_storage" | "hotel" | "food_processing" | "supermarket";
  provinceCity: string;
  assetCount: number;
  maintenanceRecordCount: number;
  referenceAnnualEnergyKwh: number;
  illustrativeAnnualEnergySavingKwh: number;
  potentialDirectTco2e: number | null;
  potentialIndirectTco2: number;
  potentialTotalTco2e: number | null;
  facilityDataProvenance: FacilityProvenance;
}

export interface PortfolioAction {
  portfolioRank: number;
  caseId: string;
  assetId: string;
  siteId: string;
  assetNameEn: string;
  equipmentGroup:
    | "central_refrigeration_or_supermarket"
    | "residential_ac_or_chiller"
    | "commercial_ac_or_heat_pump";
  refrigerant: "R-404A" | "R-507A" | "R-134a" | "R-410A" | "R-717" | "R-32";
  nominalChargeKg: number;
  referenceAnnualEnergyKwh: number;
  priority: Priority;
  decision: Decision;
  evidenceState: EvidenceState;
  finding: string;
  candidateAction: string;
  actionCostVnd: number | null;
  costSourceRecordId: string | null;
  costBasis: CostBasis;
  annualEnergySavingKwh: number;
  annualElectricitySavingVnd: number;
  energyOnlySimplePaybackMonths: number | null;
  inventoryImbalanceKg: number | null;
  directPotentialTco2e: number | null;
  indirectPotentialTco2: number;
  totalPotentialTco2e: number | null;
  evidenceConfidence: number;
  evidenceRecordIds: readonly string[];
  facilityDataProvenance: FacilityProvenance;
  impactStatus: "potential" | "no_anomaly" | "unquantified";
  claimBoundary: string;
}

export interface ClimateScenario {
  id: "historical" | "ssp245_2050" | "ssp585_2090";
  label: string;
  period: string;
  meanTemperatureC: number;
  meanDailyMaximumC: number;
  coolingDegreeDaysBase65F: number;
  hotDaysAbove35C: number;
  tropicalNightsAbove26C: number;
  annualMaximumDailyMaximumC: number;
  cddChangeVsHistoricalPct: number;
  sourcePath: string;
  scope: string;
}

export interface PolicySignal {
  id: string;
  label: string;
  value: string;
  referencePeriod: string;
  scope: string;
  sourcePath: string;
  caveat: string;
}

export const PORTFOLIO_SITES = [
  {
    siteId: "SITE-HCM-CS",
    nameVi: "Kho lạnh mẫu TP.HCM",
    labelEn: "HCMC cold store",
    sector: "cold_storage",
    provinceCity: "Ho Chi Minh City",
    assetCount: 3,
    maintenanceRecordCount: 7,
    referenceAnnualEnergyKwh: 990_000,
    illustrativeAnnualEnergySavingKwh: 25_700,
    potentialDirectTco2e: 32.623,
    potentialIndirectTco2: 16.941,
    potentialTotalTco2e: 49.564,
    facilityDataProvenance: "demonstration_scenario",
  },
  {
    siteId: "SITE-DN-HT",
    nameVi: "Khách sạn mẫu Đà Nẵng",
    labelEn: "Da Nang hotel",
    sector: "hotel",
    provinceCity: "Da Nang",
    assetCount: 2,
    maintenanceRecordCount: 5,
    referenceAnnualEnergyKwh: 738_000,
    illustrativeAnnualEnergySavingKwh: 2_500,
    potentialDirectTco2e: 6.768,
    potentialIndirectTco2: 1.648,
    potentialTotalTco2e: 8.416,
    facilityDataProvenance: "demonstration_scenario",
  },
  {
    siteId: "SITE-BD-FP",
    nameVi: "Nhà máy thực phẩm mẫu Bình Dương",
    labelEn: "Binh Duong food plant",
    sector: "food_processing",
    provinceCity: "Binh Duong",
    assetCount: 2,
    maintenanceRecordCount: 4,
    referenceAnnualEnergyKwh: 1_605_000,
    illustrativeAnnualEnergySavingKwh: 48_000,
    potentialDirectTco2e: 0,
    potentialIndirectTco2: 31.642,
    potentialTotalTco2e: 31.642,
    facilityDataProvenance: "demonstration_scenario",
  },
  {
    siteId: "SITE-HCM-SM",
    nameVi: "Siêu thị mẫu TP.HCM",
    labelEn: "HCMC supermarket",
    sector: "supermarket",
    provinceCity: "Ho Chi Minh City",
    assetCount: 2,
    maintenanceRecordCount: 5,
    referenceAnnualEnergyKwh: 912_000,
    illustrativeAnnualEnergySavingKwh: 18_000,
    potentialDirectTco2e: 74.23,
    potentialIndirectTco2: 11.866,
    potentialTotalTco2e: 86.095,
    facilityDataProvenance: "demonstration_scenario",
  },
  {
    siteId: "SITE-CT-CS",
    nameVi: "Kho lạnh mẫu Cần Thơ",
    labelEn: "Can Tho cold store",
    sector: "cold_storage",
    provinceCity: "Can Tho",
    assetCount: 1,
    maintenanceRecordCount: 2,
    referenceAnnualEnergyKwh: 228_000,
    illustrativeAnnualEnergySavingKwh: 0,
    potentialDirectTco2e: null,
    potentialIndirectTco2: 0,
    potentialTotalTco2e: null,
    facilityDataProvenance: "demonstration_scenario",
  },
] as const satisfies readonly PortfolioSite[];

const ACTION_INPUTS = [
  {
    portfolioRank: 5,
    caseId: "CT-001",
    assetId: "CT-HCM-CS-01",
    siteId: "SITE-HCM-CS",
    assetNameEn: "Cold-room screw compressor A",
    equipmentGroup: "central_refrigeration_or_supermarket",
    refrigerant: "R-404A",
    nominalChargeKg: 85,
    referenceAnnualEnergyKwh: 540_000,
    priority: "high",
    decision: "measure",
    evidenceState: "closed_action_record",
    finding: "Dirty condenser record followed by cleaning; no refrigerant-loss evidence.",
    candidateAction: "Retain the condenser-cleaning closeout and verify the energy response against weather and throughput.",
    actionCostVnd: 4_100_000,
    costSourceRecordId: "MR-002",
    costBasis: "completed_action_invoice",
    annualEnergySavingKwh: 12_000,
    inventoryImbalanceKg: 0,
    directPotentialTco2e: 0,
    indirectPotentialTco2: 7.91,
    totalPotentialTco2e: 7.91,
    evidenceConfidence: 0.91,
    evidenceRecordIds: ["MR-001", "MR-002"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "potential",
    paybackComparable: true,
    claimBoundary: "The 12,000 kWh result is an illustrative evaluation expectation, not a measured field saving.",
  },
  {
    portfolioRank: 2,
    caseId: "CT-002",
    assetId: "CT-HCM-CS-02",
    siteId: "SITE-HCM-CS",
    assetNameEn: "Freezer compressor rack B",
    equipmentGroup: "central_refrigeration_or_supermarket",
    refrigerant: "R-404A",
    nominalChargeKg: 38,
    referenceAnnualEnergyKwh: 305_000,
    priority: "critical",
    decision: "prioritize",
    evidenceState: "closed_repair_modeled_follow_up",
    finding: "Two R-404A top-ups precede a documented service-valve gasket repair and recovery record.",
    candidateAction: "Maintain repair closeout, reconcile refrigerant mass balance, and run a longer post-repair energy M&V window.",
    actionCostVnd: 14_600_000,
    costSourceRecordId: "MR-005",
    costBasis: "completed_repair_invoice",
    annualEnergySavingKwh: 8_500,
    inventoryImbalanceKg: 6.9,
    directPotentialTco2e: 32.623,
    indirectPotentialTco2: 5.603,
    totalPotentialTco2e: 38.226,
    evidenceConfidence: 0.96,
    evidenceRecordIds: ["MR-003", "MR-004", "MR-005"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "potential",
    paybackComparable: true,
    claimBoundary: "The 6.9 kg imbalance is a scenario risk signal. Direct avoided emissions are not verified by the short energy window.",
  },
  {
    portfolioRank: 6,
    caseId: "CT-003",
    assetId: "CT-HCM-CS-03",
    siteId: "SITE-HCM-CS",
    assetNameEn: "Dispatch-area evaporator",
    equipmentGroup: "central_refrigeration_or_supermarket",
    refrigerant: "R-507A",
    nominalChargeKg: 24,
    referenceAnnualEnergyKwh: 145_000,
    priority: "medium",
    decision: "measure",
    evidenceState: "closed_action_record",
    finding: "Temperature excursions align with door-open time and a door-seal record, not refrigerant loss.",
    candidateAction: "Verify door-close behavior and temperature compliance after the recorded seal replacement.",
    actionCostVnd: 3_700_000,
    costSourceRecordId: "MR-007",
    costBasis: "completed_action_invoice",
    annualEnergySavingKwh: 5_200,
    inventoryImbalanceKg: 0,
    directPotentialTco2e: 0,
    indirectPotentialTco2: 3.428,
    totalPotentialTco2e: 3.428,
    evidenceConfidence: 0.88,
    evidenceRecordIds: ["MR-006", "MR-007"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "potential",
    paybackComparable: true,
    claimBoundary: "The 5,200 kWh result is illustrative; the records do not support a refrigerant-leak claim.",
  },
  {
    portfolioRank: 9,
    caseId: "CT-004",
    assetId: "CT-DN-HT-01",
    siteId: "SITE-DN-HT",
    assetNameEn: "Hotel chilled-water chiller",
    equipmentGroup: "residential_ac_or_chiller",
    refrigerant: "R-134a",
    nominalChargeKg: 115,
    referenceAnnualEnergyKwh: 620_000,
    priority: "low",
    decision: "monitor",
    evidenceState: "weather_normalized_monitor",
    finding: "Higher power is explained by outdoor heat and hotel occupancy after weather normalization.",
    candidateAction: "Suppress the false positive and continue routine seasonal monitoring.",
    actionCostVnd: null,
    costSourceRecordId: null,
    costBasis: "no_action_cost",
    annualEnergySavingKwh: 0,
    inventoryImbalanceKg: 0,
    directPotentialTco2e: 0,
    indirectPotentialTco2: 0,
    totalPotentialTco2e: 0,
    evidenceConfidence: 0.94,
    evidenceRecordIds: ["MR-008", "MR-009"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "no_anomaly",
    paybackComparable: false,
    claimBoundary: "Weather normalization supports triage only; it does not prove equipment condition.",
  },
  {
    portfolioRank: 4,
    caseId: "CT-005",
    assetId: "CT-DN-HT-02",
    siteId: "SITE-DN-HT",
    assetNameEn: "Guest-floor VRF system",
    equipmentGroup: "commercial_ac_or_heat_pump",
    refrigerant: "R-410A",
    nominalChargeKg: 22,
    referenceAnnualEnergyKwh: 118_000,
    priority: "high",
    decision: "schedule",
    evidenceState: "open_follow_up",
    finding: "Repeated R-410A top-ups on the same branch, but no confirmed leak-location closeout.",
    candidateAction: "Complete the tightness test, document recovered mass, and issue a separately scoped repair quote.",
    actionCostVnd: 2_300_000,
    costSourceRecordId: "MR-012",
    costBasis: "diagnostic_invoice_partial_scope",
    annualEnergySavingKwh: 2_500,
    inventoryImbalanceKg: 3,
    directPotentialTco2e: 6.768,
    indirectPotentialTco2: 1.648,
    totalPotentialTco2e: 8.416,
    evidenceConfidence: 0.82,
    evidenceRecordIds: ["MR-010", "MR-011", "MR-012"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "potential",
    paybackComparable: false,
    claimBoundary: "MR-012 is a diagnostic-cost reference, not a full repair quote, so no payback is calculated.",
  },
  {
    portfolioRank: 8,
    caseId: "CT-006",
    assetId: "CT-BD-FP-01",
    siteId: "SITE-BD-FP",
    assetNameEn: "Processing-line glycol chiller",
    equipmentGroup: "residential_ac_or_chiller",
    refrigerant: "R-134a",
    nominalChargeKg: 42,
    referenceAnnualEnergyKwh: 255_000,
    priority: "medium",
    decision: "monitor",
    evidenceState: "closed_non_energy_action",
    finding: "Reference-thermometer comparison identifies a sensor offset without power or refrigerant evidence.",
    candidateAction: "Retain calibration evidence and monitor product-temperature compliance.",
    actionCostVnd: 2_900_000,
    costSourceRecordId: "MR-014",
    costBasis: "completed_non_energy_action_invoice",
    annualEnergySavingKwh: 0,
    inventoryImbalanceKg: 0,
    directPotentialTco2e: 0,
    indirectPotentialTco2: 0,
    totalPotentialTco2e: 0,
    evidenceConfidence: 0.93,
    evidenceRecordIds: ["MR-013", "MR-014"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "no_anomaly",
    paybackComparable: false,
    claimBoundary: "This is a reliability and food-temperature-control action; no carbon saving is claimed.",
  },
  {
    portfolioRank: 3,
    caseId: "CT-007",
    assetId: "CT-BD-FP-02",
    siteId: "SITE-BD-FP",
    assetNameEn: "Central ammonia freezing system",
    equipmentGroup: "central_refrigeration_or_supermarket",
    refrigerant: "R-717",
    nominalChargeKg: 420,
    referenceAnnualEnergyKwh: 1_350_000,
    priority: "high",
    decision: "prioritize",
    evidenceState: "closed_action_record",
    finding: "Reduced cooling-water flow and high condensing temperature precede descaling and pump balancing.",
    candidateAction: "Track heat-exchanger approach temperature and verify the post-descaling electricity response.",
    actionCostVnd: 18_400_000,
    costSourceRecordId: "MR-016",
    costBasis: "completed_action_invoice",
    annualEnergySavingKwh: 48_000,
    inventoryImbalanceKg: 0,
    directPotentialTco2e: 0,
    indirectPotentialTco2: 31.642,
    totalPotentialTco2e: 31.642,
    evidenceConfidence: 0.91,
    evidenceRecordIds: ["MR-015", "MR-016"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "potential",
    paybackComparable: true,
    claimBoundary: "R-717 has GWP 0 on the selected Circular 13 AR6 basis; only indirect potential is shown.",
  },
  {
    portfolioRank: 1,
    caseId: "CT-008",
    assetId: "CT-HCM-SM-01",
    siteId: "SITE-HCM-SM",
    assetNameEn: "Fresh-food refrigeration rack",
    equipmentGroup: "central_refrigeration_or_supermarket",
    refrigerant: "R-404A",
    nominalChargeKg: 95,
    referenceAnnualEnergyKwh: 770_000,
    priority: "critical",
    decision: "prioritize",
    evidenceState: "closed_repair_modeled_follow_up",
    finding: "Repeated R-404A top-ups precede a documented evaporator-joint repair and recovery record.",
    candidateAction: "Reconcile refrigerant mass balance and launch post-repair refrigerant and energy M&V.",
    actionCostVnd: 23_800_000,
    costSourceRecordId: "MR-019",
    costBasis: "completed_repair_invoice",
    annualEnergySavingKwh: 18_000,
    inventoryImbalanceKg: 15.7,
    directPotentialTco2e: 74.23,
    indirectPotentialTco2: 11.866,
    totalPotentialTco2e: 86.095,
    evidenceConfidence: 0.97,
    evidenceRecordIds: ["MR-017", "MR-018", "MR-019"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "potential",
    paybackComparable: true,
    claimBoundary: "The direct value is a scenario potential from inventory imbalance, not verified avoided emissions.",
  },
  {
    portfolioRank: 10,
    caseId: "CT-009",
    assetId: "CT-HCM-SM-02",
    siteId: "SITE-HCM-SM",
    assetNameEn: "Sales-floor rooftop unit",
    equipmentGroup: "commercial_ac_or_heat_pump",
    refrigerant: "R-32",
    nominalChargeKg: 18,
    referenceAnnualEnergyKwh: 142_000,
    priority: "low",
    decision: "monitor",
    evidenceState: "weather_normalized_monitor",
    finding: "Hot-hour load rises, but no degradation remains after weather normalization.",
    candidateAction: "Keep the filter-cleaning record and suppress an unsupported fault alert.",
    actionCostVnd: 2_200_000,
    costSourceRecordId: "MR-021",
    costBasis: "completed_maintenance_invoice_no_saving_claim",
    annualEnergySavingKwh: 0,
    inventoryImbalanceKg: 0,
    directPotentialTco2e: 0,
    indirectPotentialTco2: 0,
    totalPotentialTco2e: 0,
    evidenceConfidence: 0.95,
    evidenceRecordIds: ["MR-020", "MR-021"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "no_anomaly",
    paybackComparable: false,
    claimBoundary: "The maintenance cost is shown for work-history context; the evaluation set claims no saving.",
  },
  {
    portfolioRank: 7,
    caseId: "CT-010",
    assetId: "CT-CT-CS-01",
    siteId: "SITE-CT-CS",
    assetNameEn: "Chilled-room condensing unit",
    equipmentGroup: "central_refrigeration_or_supermarket",
    refrigerant: "R-507A",
    nominalChargeKg: 31,
    referenceAnnualEnergyKwh: 228_000,
    priority: "review",
    decision: "close_evidence_gap",
    evidenceState: "evidence_gap",
    finding: "The top-up record lacks weighing evidence and cylinder reconciliation.",
    candidateAction: "Obtain scale photos, cylinder serials, recovered mass, and a correctly scoped service record before quantification.",
    actionCostVnd: null,
    costSourceRecordId: null,
    costBasis: "future_cost_not_documented",
    annualEnergySavingKwh: 0,
    inventoryImbalanceKg: null,
    directPotentialTco2e: null,
    indirectPotentialTco2: 0,
    totalPotentialTco2e: null,
    evidenceConfidence: 0.45,
    evidenceRecordIds: ["MR-022", "MR-023"],
    facilityDataProvenance: "demonstration_scenario",
    impactStatus: "unquantified",
    paybackComparable: false,
    claimBoundary: "No direct emissions or payback may be quantified until the missing mass evidence is resolved.",
  },
] as const;

const SCENARIO_ELECTRICITY_PRICE_VND_PER_KWH = 2_100;

export const PORTFOLIO_ACTIONS: readonly PortfolioAction[] = ACTION_INPUTS
  .map(({ paybackComparable, ...action }) => {
    const annualElectricitySavingVnd = action.annualEnergySavingKwh * SCENARIO_ELECTRICITY_PRICE_VND_PER_KWH;
    const energyOnlySimplePaybackMonths =
      paybackComparable && action.actionCostVnd !== null && annualElectricitySavingVnd > 0
        ? Number(((action.actionCostVnd / annualElectricitySavingVnd) * 12).toFixed(2))
        : null;

    return {
      ...action,
      annualElectricitySavingVnd,
      energyOnlySimplePaybackMonths,
    } as PortfolioAction;
  })
  .sort((a, b) => a.portfolioRank - b.portfolioRank);

export const PORTFOLIO_SUMMARY = {
  dataAsOf: "2026-08-21",
  facilityDataProvenance: "demonstration_scenario" as FacilityProvenance,
  siteCount: 5,
  assetCount: 10,
  maintenanceRecordCount: 23,
  quantifiedAssetCount: 9,
  positiveOpportunityAssetCount: 6,
  noAnomalyOrNonCarbonAssetCount: 3,
  evidenceGapAssetCount: 1,
  referenceAnnualEnergyKwh: 4_473_000,
  illustrativeAnnualEnergySavingKwh: 94_200,
  illustrativePortfolioEnergyOpportunityPct: 2.106,
  illustrativeAnnualElectricitySavingVnd: 197_820_000,
  quantifiedDirectPotentialTco2eUnrounded: 113.6208,
  quantifiedIndirectPotentialTco2Unrounded: 62.09664,
  summedCaseLevelPotentialTco2eUnrounded: 175.71744,
  quantifiedDirectPotentialTco2e: 113.621,
  quantifiedIndirectPotentialTco2: 62.097,
  summedCaseLevelPotentialTco2e: 175.717,
  pricedRecordCount: 8,
  documentedDemoInvoiceCostReferenceVnd: 72_000_000,
  comparablePaybackActionCount: 5,
  comparableActionCostVnd: 64_600_000,
  comparableAnnualEnergySavingKwh: 91_700,
  comparableAnnualElectricitySavingVnd: 192_570_000,
  weightedEnergyOnlySimplePaybackMonths: 4.03,
  calculationNotes: [
    "Exact potential lineage is 113.6208 direct + 62.09664 indirect = 175.71744 tCO2e; display values are rounded only after the underlying calculations and are not verified portfolio abatements.",
    "Energy savings use the scenario planning price of VND 2,100/kWh from public_reference_factors.json.",
    "The comparable payback subset contains CT-001, CT-002, CT-003, CT-007 and CT-008 only, where the documented demo invoice scope matches the modeled action.",
    "Payback excludes carbon value, refrigerant replacement value, tax, financing, downtime and operational-risk benefits.",
  ],
} as const;

export const FOCUSED_MV_CASE = {
  caseId: "CT-002",
  assetId: "CT-HCM-CS-02",
  verificationWindowStartIct: "2025-05-05T14:00:00+07:00",
  verificationWindowEndIct: "2025-05-20T06:45:00+07:00",
  postRepairMeasuredEnergyKwh: 9_499.6,
  degradedCounterfactualEnergyKwh: 11_767.1,
  modeledAvoidedEnergyKwh: 2_267.5,
  modeledEnergyReductionPct: 19.27,
  modeledScope2AvoidedTco2: 1.495,
  modeledCostAvoidedVnd: 4_761_647,
  assumedRelativeUncertaintyPct: 12,
  weatherBasis: "NASA POWER public hourly, interpolated to 15-minute intervals",
  facilitySignalsBasis: "deterministic demonstration scenario",
  methodStatus: "demonstration M&V; not IPMVP certified",
  directRefrigerantAvoidanceStatus: "not verified by the short energy window",
  sourcePath: "vietnam_data/facility_demo/post_repair_verification.json",
} as const;

export const PUBLIC_DATA_FOOTPRINT = {
  retrievedOn: "2026-08-21",
  provenance: "public_source_or_deterministic_derivative" as PublicProvenance,
  totalWeatherRows: 60_656,
  dailyWeatherRows: 25_568,
  hourlyWeatherRows: 35_088,
  locations: ["Ho Chi Minh City", "Bau Bang, Binh Duong"],
  dailyPeriod: "1991-01-01 to 2025-12-31",
  hourlyPeriod: "2024-01-01 to 2025-12-31",
  cmip6ProjectionRows: 9,
  sources: [
    {
      name: "NASA POWER MERRA-2 / GEOS",
      rows: 60_656,
      role: "Historical heat and weather-normalization context",
      sourcePath: "vietnam_data/derived/weather_hcmc_daily_1991_2025.csv",
      caveat: "Grid-scale modeled/reanalysis weather, not a facility sensor.",
    },
    {
      name: "World Bank CCKP CMIP6",
      rows: 9,
      role: "Vietnam national climate-scenario context",
      sourcePath: "vietnam_data/derived/climate_projection_vietnam_cmip6.csv",
      caveat: "Country-level ensemble scenarios, not downscaled facility forecasts or probabilities.",
    },
    {
      name: "Vietnam Department of Climate Change",
      rows: 2,
      role: "Location-based electricity emissions factors",
      sourcePath: "vietnam_data/vietnam_grid_emission_factors.csv",
      caveat: "National-average CO2 factor, not a supplier-specific or marginal factor.",
    },
    {
      name: "Circular 13/2024/TT-BXD",
      rows: 6,
      role: "AR6 GWP100 factors used for facility reporting screens",
      sourcePath: "vietnam_data/derived/public_reference_factors.json",
      caveat: "The factor converts a supported mass balance; it does not prove a top-up was emitted.",
    },
  ],
} as const;

export const LOCAL_CLIMATE_SIGNALS = [
  {
    locationId: "hcmc",
    label: "Ho Chi Minh City",
    period: "1991–2025",
    meanTemperatureTrendCPerDecade: 0.22,
    hotDaysAbove35CTrendDaysPerDecade: 0.43,
    cdd18TrendDegreeDaysPerDecade: 80.4,
    sourcePath: "vietnam_data/derived/climate_trend_ols_1991_2025.csv",
    interpretation: "Ordinary-least-squares screen on annual NASA POWER summaries; not a causal attribution study.",
  },
  {
    locationId: "bau_bang_binh_duong",
    label: "Bau Bang, Binh Duong",
    period: "1991–2025",
    meanTemperatureTrendCPerDecade: 0.236,
    hotDaysAbove35CTrendDaysPerDecade: 2.68,
    cdd18TrendDegreeDaysPerDecade: 86.5,
    sourcePath: "vietnam_data/derived/climate_trend_ols_1991_2025.csv",
    interpretation: "Ordinary-least-squares screen on annual NASA POWER summaries; not a causal attribution study.",
  },
] as const;

export const CLIMATE_SCENARIOS = [
  {
    id: "historical",
    label: "Historical ensemble",
    period: "1995–2014",
    meanTemperatureC: 24.22,
    meanDailyMaximumC: 27.67,
    coolingDegreeDaysBase65F: 4_133.28,
    hotDaysAbove35C: 5.1,
    tropicalNightsAbove26C: 28.05,
    annualMaximumDailyMaximumC: 35.47,
    cddChangeVsHistoricalPct: 0,
    sourcePath: "vietnam_data/derived/climate_projection_vietnam_cmip6.csv",
    scope: "Median multi-model ensemble spatial mean for Vietnam.",
  },
  {
    id: "ssp245_2050",
    label: "SSP2–4.5 mid-century",
    period: "2040–2059",
    meanTemperatureC: 25.46,
    meanDailyMaximumC: 28.88,
    coolingDegreeDaysBase65F: 4_868.72,
    hotDaysAbove35C: 16.28,
    tropicalNightsAbove26C: 72.02,
    annualMaximumDailyMaximumC: 37.04,
    cddChangeVsHistoricalPct: 17.79,
    sourcePath: "vietnam_data/derived/climate_projection_vietnam_cmip6.csv",
    scope: "Median multi-model ensemble spatial mean for Vietnam; scenario, not forecast.",
  },
  {
    id: "ssp585_2090",
    label: "SSP5–8.5 late-century",
    period: "2080–2099",
    meanTemperatureC: 28.06,
    meanDailyMaximumC: 31.52,
    coolingDegreeDaysBase65F: 6_447.53,
    hotDaysAbove35C: 80.93,
    tropicalNightsAbove26C: 168.21,
    annualMaximumDailyMaximumC: 40.18,
    cddChangeVsHistoricalPct: 55.99,
    sourcePath: "vietnam_data/derived/climate_projection_vietnam_cmip6.csv",
    scope: "Median multi-model ensemble spatial mean for Vietnam; scenario, not forecast.",
  },
] as const satisfies readonly ClimateScenario[];

export const PUBLIC_FACTORS = {
  vietnamGridFactor2023: {
    valueTco2PerMwh: 0.6592,
    valueKgco2PerKwh: 0.6592,
    status: "official published factor",
    sourcePath: "vietnam_data/vietnam_grid_emission_factors.csv",
    useBoundary: "Location-based Scope 2 screening only.",
  },
  selectedGwpBasis: "AR6 GWP100 from Circular 13/2024/TT-BXD",
  refrigerantGwp100: {
    "R-404A": 4_728,
    "R-410A": 2_256,
    "R-134a": 1_530,
    "R-507A": 4_775,
    "R-32": 771,
    "R-717": 0,
  },
  scenarioElectricityPriceVndPerKwh: SCENARIO_ELECTRICITY_PRICE_VND_PER_KWH,
  sourcePath: "vietnam_data/derived/public_reference_factors.json",
} as const;

export const POLICY_SIGNALS = [
  {
    id: "hfc_servicing_share_2022",
    label: "Servicing share of Vietnam HFC consumption",
    value: "69% of HFC tCO2e in 2022",
    referencePeriod: "2022",
    scope: "Vietnam manufacturing plus servicing",
    sourcePath: "vietnam_data/vietnam_cooling_context_facts.csv",
    caveat: "National consumption is not the same as facility leakage.",
  },
  {
    id: "refrigeration_hfc_2022",
    label: "Refrigeration HFC consumption",
    value: "954,141 tCO2e",
    referencePeriod: "2022",
    scope: "Vietnam refrigeration sector",
    sourcePath: "vietnam_data/vietnam_hfc_consumption_2018_2022.csv",
    caveat: "Sector context only; it is not addressable market or COOL:TRACE impact.",
  },
  {
    id: "kigali_2045",
    label: "Kigali HFC phasedown obligation",
    value: "80% below a 13.991 MtCO2e baseline; 2.798 MtCO2e maximum",
    referencePeriod: "2045 onward",
    scope: "Vietnam national HFC consumption",
    sourcePath: "vietnam_data/vietnam_kigali_hfc_schedule.csv",
    caveat: "National obligation; not a facility compliance determination.",
  },
  {
    id: "ndc_2030",
    label: "Vietnam 2030 NDC reduction below BAU",
    value: "15.8% unconditional / 43.5% conditional",
    referencePeriod: "2030",
    scope: "Vietnam economy-wide",
    sourcePath: "vietnam_data/vietnam_cooling_context_facts.csv",
    caveat: "Alignment context, not project attribution.",
  },
  {
    id: "cold_chain_gap",
    label: "Cold-chain demand and adoption gap",
    value: "Food accounts for 80% of demand; 14% of producers reported using cold chain",
    referencePeriod: "World Bank report published 2020",
    scope: "Vietnam cold chain",
    sourcePath: "vietnam_data/vietnam_cooling_context_facts.csv",
    caveat: "The report cites third-party market studies; values are contextual, not current customer counts.",
  },
] as const satisfies readonly PolicySignal[];

export const CLIMATE_STRESS_TEST = [
  { deltaC: 0, energyKwh: 18_453.7, scope2Tco2: 12.165, peakPowerKw: 40.71, alertHoursAbove90PctNameplate: 0, energyChangePct: 0 },
  { deltaC: 1.5, energyKwh: 19_518.9, scope2Tco2: 12.867, peakPowerKw: 42.29, alertHoursAbove90PctNameplate: 0, energyChangePct: 5.77 },
  { deltaC: 2, energyKwh: 19_876.9, scope2Tco2: 13.103, peakPowerKw: 42.81, alertHoursAbove90PctNameplate: 0, energyChangePct: 7.71 },
  { deltaC: 3, energyKwh: 20_593, scope2Tco2: 13.575, peakPowerKw: 43.86, alertHoursAbove90PctNameplate: 2.25, energyChangePct: 11.59 },
] as const;

export const CLAIM_BOUNDARIES = {
  facilityRecords: "All sites, assets, invoices, maintenance notes, power signals, repairs and outcomes are deterministic demonstration records, not customer or partner data.",
  publicWeather: "NASA POWER values are grid-scale modeled/reanalysis weather. They are not measurements made at any demonstration facility.",
  climateScenarios: "World Bank CCKP CMIP6 values are national ensemble scenarios. They are not facility forecasts, probabilities or downscaled engineering design conditions.",
  directEmissions: "A top-up is a risk signal. Potential direct tCO2e requires a supported inventory boundary and is never presented here as verified avoided emissions.",
  indirectEmissions: "Indirect potential is a location-based Scope 2 screen using the 2023 national grid factor; it is not supplier-specific or marginal emissions.",
  costs: "Action costs are demonstration invoice references. They are not market quotes, partner pricing or promised implementation budgets.",
  payback: "Payback is energy-only at VND 2,100/kWh and is calculated only where the documented demo invoice scope matches the modeled action.",
  verification: "The only post-repair result is a short demonstration M&V comparison with a ±12% scenario uncertainty assumption; it is not IPMVP-certified or field-verified.",
} as const;

export const SOURCE_PATHS = {
  sites: "vietnam_data/facility_demo/sites.csv",
  assets: "vietnam_data/facility_demo/asset_registry.csv",
  maintenance: "vietnam_data/facility_demo/maintenance_records.csv",
  evaluationExpectations: "vietnam_data/facility_demo/case_ground_truth.json",
  calculationAssumptions: "vietnam_data/facility_demo/calculation_assumptions.json",
  postRepairVerification: "vietnam_data/facility_demo/post_repair_verification.json",
  climateStressTest: "vietnam_data/facility_demo/climate_stress_test.csv",
  climateTrends: "vietnam_data/derived/climate_trend_ols_1991_2025.csv",
  climateProjections: "vietnam_data/derived/climate_projection_vietnam_cmip6.csv",
  publicFactors: "vietnam_data/derived/public_reference_factors.json",
  gridFactors: "vietnam_data/vietnam_grid_emission_factors.csv",
  hfcConsumption: "vietnam_data/vietnam_hfc_consumption_2018_2022.csv",
  kigaliSchedule: "vietnam_data/vietnam_kigali_hfc_schedule.csv",
  coolingContext: "vietnam_data/vietnam_cooling_context_facts.csv",
} as const;
