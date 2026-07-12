import type { Response } from "express";
import type { InputRow, ValidationError, ValidationErrorResponse } from "@fleet/shared";

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sendValidationError(
  res: Response<ValidationErrorResponse>,
  details: ValidationError[]
) {
  return res.status(400).json({
    error: "validation_failed",
    details
  });
}

export function validateInputRows(value: unknown, path: string): ValidationError[] {
  if (!Array.isArray(value)) {
    return [
      {
        path,
        message: `${path} must be an array of string records.`
      }
    ];
  }

  const errors: ValidationError[] = [];

  value.forEach((row, rowIndex) => {
    if (!isPlainObject(row)) {
      errors.push({
        path: `${path}[${rowIndex}]`,
        message: "Each row must be an object with string values."
      });
      return;
    }

    Object.entries(row as InputRow).forEach(([key, cellValue]) => {
      if (typeof cellValue !== "string") {
        errors.push({
          path: `${path}[${rowIndex}].${key}`,
          message: "Each field value must be a string."
        });
      }
    });
  });

  return errors;
}
