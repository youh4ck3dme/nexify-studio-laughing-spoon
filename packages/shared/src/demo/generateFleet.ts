import type { InputRow } from "../types.js";

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZONES = ["A", "B", "C", "D", "E"];
const SOURCES = ["web", "phone", "partner", "app"];
const STATUSES_RIDE = ["completed", "completed", "completed", "cancelled", "completed"];
const STATUSES_LEAD = ["new", "new", "contacted", "converted", "booked", "lost"];

export type DemoFleet = {
  rides: InputRow[];
  leads: InputRow[];
};

export function generateDemoFleet(seed = 42): DemoFleet {
  const random = mulberry32(seed);
  const rides: InputRow[] = [];
  const leads: InputRow[] = [];

  const drivers = Array.from({ length: 22 }, (_, i) => `d${String(i + 101).padStart(3, "0")}`);

  for (let i = 0; i < 500; i++) {
    let zone: string;
    let hour: number;

    if (random() < 0.35) {
      zone = "A";
      hour = 17 + Math.floor(random() * 3);
    } else if (random() < 0.25) {
      zone = "C";
      hour = 10 + Math.floor(random() * 4);
    } else {
      zone = ZONES[Math.floor(random() * ZONES.length)] ?? "B";
      hour = 6 + Math.floor(random() * 16);
    }

    const isPeak = hour >= 17 && hour <= 19;
    const baseFare = zone === "A" && isPeak ? 12 + random() * 6 : 10 + random() * 10;
    const status = zone === "A" && isPeak && random() < 0.08
      ? "cancelled"
      : STATUSES_RIDE[Math.floor(random() * STATUSES_RIDE.length)] ?? "completed";

    const day = 1 + Math.floor(random() * 28);
    rides.push({
      ride_id: `r${i + 1}`,
      zone,
      hour_slot: String(hour),
      fare: (Math.round(baseFare * 100) / 100).toFixed(2),
      driver_id: drivers[Math.floor(random() * drivers.length)] ?? "d101",
      status,
      timestamp: `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:30:00Z`
    });
  }

  for (let i = 0; i < 150; i++) {
    const priority = random() < 0.4 ? "A" : random() < 0.7 ? "B" : "C";
    let status: string;
    if (priority === "A" && random() < 0.45) {
      status = "new";
    } else {
      status = STATUSES_LEAD[Math.floor(random() * STATUSES_LEAD.length)] ?? "new";
    }

    const day = 1 + Math.floor(random() * 28);
    const hour = Math.floor(random() * 24);
    leads.push({
      lead_id: `l${i + 1}`,
      source: SOURCES[Math.floor(random() * SOURCES.length)] ?? "web",
      priority,
      created_at: `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:15:00Z`,
      status
    });
  }

  return { rides, leads };
}

export function demoFleetToCsv(fleet: DemoFleet): { ridesCsv: string; leadsCsv: string } {
  const rideHeaders = ["ride_id", "zone", "hour_slot", "fare", "driver_id", "status", "timestamp"];
  const leadHeaders = ["lead_id", "source", "priority", "created_at", "status"];

  const ridesCsv = [
    rideHeaders.join(","),
    ...fleet.rides.map((r) => rideHeaders.map((h) => r[h] ?? "").join(","))
  ].join("\n");

  const leadsCsv = [
    leadHeaders.join(","),
    ...fleet.leads.map((l) => leadHeaders.map((h) => l[h] ?? "").join(","))
  ].join("\n");

  return { ridesCsv, leadsCsv };
}
