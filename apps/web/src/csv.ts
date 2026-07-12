export class CsvImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvImportError";
  }
}

export interface ParseCsvOptions {
  requiredHeaders?: string[];
}

export interface ParsedCsv {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export function parseCsv(input: string, options: ParseCsvOptions = {}): ParsedCsv {
  const rows = tokenizeCsv(input);
  const [headerRow, ...dataRows] = rows;

  if (!headerRow || headerRow.length === 0) {
    throw new CsvImportError("CSV is empty. Add a header row and at least one data row.");
  }

  const headers = headerRow.map((header) => header.replace(/^\uFEFF/, "").trim());
  validateHeaders(headers, options.requiredHeaders ?? []);

  const mappedRows = dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row, index) => mapRow(row, headers, index + 2));

  return { headers, rows: mappedRows };
}

function tokenizeCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let lineNumber = 1;
  let quotedFieldStartLine = 1;

  const normalized = input.replace(/\r\n?/g, "\n");

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const nextCharacter = normalized[index + 1];

    if (inQuotes) {
      if (character === "\"") {
        if (nextCharacter === "\"") {
          cell += "\"";
          index += 1;
          continue;
        }

        inQuotes = false;
        continue;
      }

      if (character === "\n") {
        lineNumber += 1;
      }

      cell += character;
      continue;
    }

    if (character === "\"") {
      inQuotes = true;
      quotedFieldStartLine = lineNumber;
      continue;
    }

    if (character === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (character === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      lineNumber += 1;
      continue;
    }

    cell += character;
  }

  if (inQuotes) {
    throw new CsvImportError(
      `CSV format error on line ${quotedFieldStartLine}: closing quote is missing.`
    );
  }

  row.push(cell.trim());
  rows.push(row);

  return rows.filter((item) => !(item.length === 1 && item[0] === ""));
}

function validateHeaders(headers: string[], requiredHeaders: string[]): void {
  const missingHeaders = requiredHeaders.filter((required) => !headers.includes(required));

  if (missingHeaders.length > 0) {
    throw new CsvImportError(
      `CSV is missing required column(s): ${missingHeaders.join(", ")}. ` +
        `Available columns: ${headers.join(", ")}.`
    );
  }
}

function mapRow(row: string[], headers: string[], lineNumber: number): Record<string, string> {
  if (row.length !== headers.length) {
    throw new CsvImportError(
      `Row ${lineNumber} has ${row.length} value(s), but ${headers.length} column(s) are required.`
    );
  }

  return headers.reduce<Record<string, string>>((record, header, index) => {
    record[header] = row[index] ?? "";
    return record;
  }, {});
}
