import type { FleetKpis, KpiTrend, LeadRow, RideRow } from "../types.js";

const PEAK_HOURS = new Set([7, 8, 9, 17, 18, 19, 20]);
const HOURS_PER_DAY = 9;
const AVG_BILLABLE_HOURS = 3;
const TARGET_UTILIZATION = 78;
const TARGET_CONVERSION = 42;

function countVehicleDays(rides: RideRow[]): number {
  const days = new Set<string>();
  for (const ride of rides) {
    if (ride.status !== "completed") continue;
    const date = ride.timestamp?.slice(0, 10) ?? "unknown";
    days.add(`${ride.driverId}|${date}`);
  }
  return Math.max(days.size, 1);
}

function trend(current: number, target: number, higherIsBetter: boolean): KpiTrend {
  const deltaPct = target === 0 ? 0 : ((current - target) / target) * 100;
  if (Math.abs(deltaPct) < 2) return { direction: "flat", deltaPct: 0 };
  const good = higherIsBetter ? deltaPct > 0 : deltaPct < 0;
  return { direction: good ? "up" : "down", deltaPct: Math.round(deltaPct * 10) / 10 };
}

export function computeKpis(rides: RideRow[], leads: LeadRow[]): FleetKpis {
  const completed = rides.filter((r) => r.status === "completed");
  const revenue = completed.reduce((sum, r) => sum + r.fare, 0);
  const avgFare = completed.length > 0 ? revenue / completed.length : 15;

  const vehicleDays = countVehicleDays(rides);
  const totalAvailableHours = vehicleDays * HOURS_PER_DAY;
  const rideHours = completed.length * AVG_BILLABLE_HOURS;
  const idleHours = Math.max(0, totalAvailableHours - rideHours);
  const utilizationPct =
    totalAvailableHours > 0 ? Math.min(100, (rideHours / totalAvailableHours) * 100) : 0;

  const convertedLeads = leads.filter(
    (l) => l.status === "converted" || l.status === "booked" || l.status === "completed"
  ).length;
  const leadConversionPct = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

  const lostLeads = leads.filter((l) => l.status === "new" || l.status === "lost").length;
  const conversionGap = Math.max(0, TARGET_CONVERSION - leadConversionPct) / 100;
  const avgRevenuePerVehicleHour = avgFare * 0.8;
  const peakMissed = rides.filter(
    (r) => PEAK_HOURS.has(r.hourSlot) && r.status !== "completed"
  ).length;
  const estimatedLeakageEur =
    lostLeads * avgFare * conversionGap * 0.6 +
    idleHours * 0.03 * avgRevenuePerVehicleHour +
    peakMissed * avgFare * 0.2;

  const targetRevenue = revenue * 1.18;

  return {
    revenue: Math.round(revenue * 100) / 100,
    utilizationPct: Math.round(utilizationPct * 10) / 10,
    idleHours: Math.round(idleHours * 10) / 10,
    leadConversionPct: Math.round(leadConversionPct * 10) / 10,
    estimatedLeakageEur: Math.round(estimatedLeakageEur * 100) / 100,
    completedRides: completed.length,
    trends: {
      revenue: trend(revenue, targetRevenue, true),
      utilization: trend(utilizationPct, TARGET_UTILIZATION, true),
      conversion: trend(leadConversionPct, TARGET_CONVERSION, true),
      idleHours: trend(idleHours, totalAvailableHours * 0.15, false)
    },
    targets: {
      revenue: Math.round(targetRevenue * 100) / 100,
      utilizationPct: TARGET_UTILIZATION,
      leadConversionPct: TARGET_CONVERSION,
      idleHours: Math.round(totalAvailableHours * 0.15 * 10) / 10,
      leakageEur: 0
    }
  };
}

export function emptyKpis(): FleetKpis {
  return {
    revenue: 0,
    utilizationPct: 0,
    idleHours: 0,
    leadConversionPct: 0,
    estimatedLeakageEur: 0,
    completedRides: 0,
    trends: {
      revenue: { direction: "flat", deltaPct: 0 },
      utilization: { direction: "flat", deltaPct: 0 },
      conversion: { direction: "flat", deltaPct: 0 },
      idleHours: { direction: "flat", deltaPct: 0 }
    },
    targets: {
      revenue: 0,
      utilizationPct: TARGET_UTILIZATION,
      leadConversionPct: TARGET_CONVERSION,
      idleHours: 0,
      leakageEur: 0
    }
  };
}
