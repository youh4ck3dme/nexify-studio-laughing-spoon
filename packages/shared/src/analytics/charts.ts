import type { ChartData, LeadRow, RideRow } from "../types.js";

export function computeCharts(rides: RideRow[], leads: LeadRow[]): ChartData {
  const revenueByDayMap = new Map<string, number>();
  const completed = rides.filter((r) => r.status === "completed");

  for (const ride of completed) {
    const date = ride.timestamp
      ? ride.timestamp.slice(0, 10)
      : `2026-07-${String((parseInt(ride.rideId.replace(/\D/g, ""), 10) || 1) % 28 + 1).padStart(2, "0")}`;
    revenueByDayMap.set(date, (revenueByDayMap.get(date) ?? 0) + ride.fare);
  }

  const revenueByDay = [...revenueByDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));

  const zoneMap = new Map<string, { total: number; completed: number }>();
  for (const ride of rides) {
    const z = zoneMap.get(ride.zone) ?? { total: 0, completed: 0 };
    z.total += 1;
    if (ride.status === "completed") z.completed += 1;
    zoneMap.set(ride.zone, z);
  }

  const utilizationByZone = [...zoneMap.entries()].map(([zone, data]) => ({
    zone,
    utilizationPct: data.total > 0 ? Math.round((data.completed / data.total) * 1000) / 10 : 0
  }));

  const leadCount = leads.length;
  const contacted = leads.filter((l) => l.status === "contacted" || l.status === "converted" || l.status === "booked" || l.status === "completed").length;
  const booked = leads.filter((l) => l.status === "booked" || l.status === "converted" || l.status === "completed").length;
  const completedRides = leads.filter((l) => l.status === "completed" || l.status === "converted").length;

  const leadFunnel = [
    { stage: "Leads", count: leadCount, pct: 100 },
    {
      stage: "Contacted",
      count: contacted,
      pct: leadCount > 0 ? Math.round((contacted / leadCount) * 1000) / 10 : 0
    },
    {
      stage: "Booked",
      count: booked,
      pct: leadCount > 0 ? Math.round((booked / leadCount) * 1000) / 10 : 0
    },
    {
      stage: "Completed",
      count: completedRides,
      pct: leadCount > 0 ? Math.round((completedRides / leadCount) * 1000) / 10 : 0
    }
  ];

  return { revenueByDay, utilizationByZone, leadFunnel };
}
