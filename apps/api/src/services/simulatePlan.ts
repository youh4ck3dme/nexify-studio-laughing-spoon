import { simulatePlan, type FleetKpis, type Recommendation, type SimulationRequest } from "@fleet/shared";

export function runSimulation(
  request: SimulationRequest,
  recommendations: Recommendation[]
) {
  return simulatePlan(request, recommendations);
}

export type { FleetKpis, Recommendation, SimulationRequest };
