import type { RideRow, ZoneMetrics } from "../types.js";

const PEAK_HOURS = new Set([17, 18, 19]);

export function computeZones(rides: RideRow[]): ZoneMetrics[] {
  const zoneMap = new Map<string, { demand: number; completed: number; drivers: Set<string>; revenue: number }>();

  for (const ride of rides) {
    const existing = zoneMap.get(ride.zone) ?? {
      demand: 0,
      completed: 0,
      drivers: new Set<string>(),
      revenue: 0
    };
    existing.demand += 1;
    existing.drivers.add(ride.driverId);
    if (ride.status === "completed") {
      existing.completed += 1;
      existing.revenue += ride.fare;
    }
    zoneMap.set(ride.zone, existing);
  }

  const zones: ZoneMetrics[] = [];

  for (const [zone, data] of zoneMap) {
    const supply = data.drivers.size;
    const peakDemand = rides.filter(
      (r) => r.zone === zone && PEAK_HOURS.has(r.hourSlot)
    ).length;
    const utilizationPct = data.demand > 0 ? (data.completed / data.demand) * 100 : 0;
    const demandSupplyRatio = supply > 0 ? data.demand / supply : data.demand;
    const idleCapacity = Math.max(0, supply * 3 - data.completed);
    const avgFare = data.completed > 0 ? data.revenue / data.completed : 14;
    const unmetDemand = Math.max(0, data.demand - data.completed);
    const isCritical = demandSupplyRatio > 1.3 || (peakDemand > supply * 2 && zone !== "C");
    const revenueOpportunity = isCritical
      ? Math.round(data.revenue * Math.max(0, demandSupplyRatio - 1) * 0.35 * 100) / 100
      : Math.round(Math.max(idleCapacity * avgFare * 0.4, unmetDemand * avgFare * 0.25) * 100) / 100;

    let explanation = `Zone ${zone}: ${data.demand} rides, ${supply} vehicles.`;
    if (isCritical) {
      explanation += " High demand-to-supply ratio — rebalancing could capture missed revenue.";
    } else if (idleCapacity > supply) {
      explanation += " Underutilized capacity — consider redeployment or pricing adjustments.";
    }

    zones.push({
      zone,
      demand: data.demand,
      supply,
      idleCapacity: Math.round(idleCapacity * 10) / 10,
      revenueOpportunity,
      utilizationPct: Math.round(utilizationPct * 10) / 10,
      isCritical,
      explanation
    });
  }

  return zones.sort((a, b) => b.revenueOpportunity - a.revenueOpportunity);
}
