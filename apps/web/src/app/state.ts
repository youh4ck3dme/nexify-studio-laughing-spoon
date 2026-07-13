import type { AnalysisResponse, InputRow, SimulationResponse } from "@fleet/shared";

export type Screen =
  | "landing"
  | "analyzing"
  | "commandCenter"
  | "opportunityMap"
  | "recommendations"
  | "simulationStudio"
  | "executiveBrief"
  | "wowApplied";

export type SimulationSelection = {
  actionId: string;
  intensity: number;
  enabled: boolean;
};

export type AppState = {
  screen: Screen;
  rides: InputRow[];
  leads: InputRow[];
  analysis: AnalysisResponse | null;
  simulation: SimulationResponse | null;
  simulationSelections: SimulationSelection[];
  compareMode: boolean;
  wowApplied: boolean;
  uploadPanelOpen: boolean;
  judgeModeOpen: boolean;
  analysisStep: number;
  error: string;
  dataSource: "demo" | "csv" | null;
};

export function createInitialState(): AppState {
  return {
    screen: "landing",
    rides: [],
    leads: [],
    analysis: null,
    simulation: null,
    simulationSelections: [],
    compareMode: false,
    wowApplied: false,
    uploadPanelOpen: false,
    judgeModeOpen: false,
    analysisStep: 0,
    error: "",
    dataSource: null
  };
}

export const ANALYSIS_STEPS = [
  "Parsing fleet records…",
  "Computing KPIs and trends…",
  "Mapping zone opportunities…",
  "Generating AI recommendations…"
];
