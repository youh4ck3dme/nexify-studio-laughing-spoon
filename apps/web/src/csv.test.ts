import { describe, expect, it } from "vitest";
import { CsvImportError, parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses quoted CSV values and escaped quotes", () => {
    const csv = [
      "ride_id,zone,notes",
      'r1,"North, East","Driver said ""hello"""'
    ].join("\n");

    const parsed = parseCsv(csv, { requiredHeaders: ["ride_id", "zone", "notes"] });

    expect(parsed.rows).toEqual([
      {
        ride_id: "r1",
        zone: "North, East",
        notes: 'Driver said "hello"'
      }
    ]);
  });

  it("throws a clear error when required headers are missing", () => {
    const csv = ["ride_id,zone", "r1,A"].join("\n");

    expect(() => parseCsv(csv, { requiredHeaders: ["ride_id", "zone", "fare"] })).toThrowError(
      new CsvImportError(
        "CSV is missing required column(s): fare. Available columns: ride_id, zone."
      )
    );
  });

  it("keeps empty field values instead of dropping columns", () => {
    const csv = ["ride_id,zone,fare", "r1,,", "r2,B,11.5"].join("\n");

    const parsed = parseCsv(csv, { requiredHeaders: ["ride_id", "zone", "fare"] });

    expect(parsed.rows).toEqual([
      { ride_id: "r1", zone: "", fare: "" },
      { ride_id: "r2", zone: "B", fare: "11.5" }
    ]);
  });

  it("throws for malformed rows with the line number", () => {
    const csv = ["ride_id,zone,fare", "r1,A,10", "r2,B"].join("\n");

    expect(() => parseCsv(csv, { requiredHeaders: ["ride_id", "zone", "fare"] })).toThrowError(
      new CsvImportError("Row 3 has 2 value(s), but 3 column(s) are required.")
    );
  });

  it("returns a user-friendly parse error for unclosed quotes", () => {
    const csv = ['ride_id,notes', 'r1,"broken note'].join("\n");

    expect(() => parseCsv(csv, { requiredHeaders: ["ride_id", "notes"] })).toThrowError(
      new CsvImportError("CSV format error on line 2: closing quote is missing.")
    );
  });
});
