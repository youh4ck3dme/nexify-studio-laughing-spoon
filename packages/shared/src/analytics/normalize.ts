import type { InputRow, LeadRow, RideRow } from "../types.js";

const RIDE_ALIASES: Record<keyof RideRow, string[]> = {
  rideId: ["ride_id", "rideid", "ride id", "id"],
  zone: ["zone", "area", "region", "district"],
  hourSlot: ["hour_slot", "hourslot", "hour", "time_slot", "timeslot"],
  fare: ["fare", "price", "amount", "revenue", "total"],
  driverId: ["driver_id", "driverid", "driver", "vehicle_id", "vehicleid"],
  status: ["status", "ride_status", "state"],
  timestamp: ["timestamp", "date", "created_at", "datetime", "ride_date"]
};

const LEAD_ALIASES: Record<keyof LeadRow, string[]> = {
  leadId: ["lead_id", "leadid", "lead id", "id"],
  source: ["source", "channel", "origin"],
  priority: ["priority", "tier", "grade", "level"],
  createdAt: ["created_at", "createdat", "date", "timestamp", "created"],
  status: ["status", "lead_status", "state"]
};

function normalizeKey(key: string): string {
  return key.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function findColumn(headers: string[], aliases: string[]): string | undefined {
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeKey(h) }));
  for (const alias of aliases) {
    const match = normalized.find((h) => h.norm === alias);
    if (match) return match.raw;
  }
  return undefined;
}

function getField(row: InputRow, headers: string[], aliases: string[], fallback = ""): string {
  const col = findColumn(headers, aliases);
  if (!col) return fallback;
  return (row[col] ?? fallback).trim();
}

export function normalizeRideRows(rows: InputRow[]): RideRow[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0] ?? {});

  return rows.map((row, index) => {
    const rideId = getField(row, headers, RIDE_ALIASES.rideId, `ride-${index + 1}`);
    const fareRaw = getField(row, headers, RIDE_ALIASES.fare, "0");
    const hourRaw = getField(row, headers, RIDE_ALIASES.hourSlot, "12");
    const fare = parseFloat(fareRaw) || 0;
    const hourSlot = Math.min(23, Math.max(0, parseInt(hourRaw, 10) || 12));

    return {
      rideId,
      zone: getField(row, headers, RIDE_ALIASES.zone, "Unknown").toUpperCase(),
      hourSlot,
      fare,
      driverId: getField(row, headers, RIDE_ALIASES.driverId, `driver-${index % 20}`),
      status: getField(row, headers, RIDE_ALIASES.status, "completed").toLowerCase(),
      timestamp: getField(row, headers, RIDE_ALIASES.timestamp, "")
    };
  });
}

export function normalizeLeadRows(rows: InputRow[]): LeadRow[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0] ?? {});

  return rows.map((row, index) => ({
    leadId: getField(row, headers, LEAD_ALIASES.leadId, `lead-${index + 1}`),
    source: getField(row, headers, LEAD_ALIASES.source, "web").toLowerCase(),
    priority: getField(row, headers, LEAD_ALIASES.priority, "B").toUpperCase(),
    createdAt: getField(row, headers, LEAD_ALIASES.createdAt, ""),
    status: getField(row, headers, LEAD_ALIASES.status, "new").toLowerCase()
  }));
}
