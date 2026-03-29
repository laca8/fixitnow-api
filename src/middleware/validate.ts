import { Request, Response, NextFunction } from "express";
import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { errorResponse } from "../utils/helpers";

// Converts class-validator errors into a flat key->message object
function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const err of errors) {
    const key = err.property;
    if (err.constraints) {
      result[key] = Object.values(err.constraints);
    }
    // nested
    if (err.children?.length) {
      const nested = formatErrors(err.children);
      for (const [k, v] of Object.entries(nested)) {
        result[`${key}.${k}`] = v;
      }
    }
  }
  return result;
}

/**
 * Validate request body against a DTO class.
 * Usage: router.post("/", validate(MyDto), controller)
 */
export function validateBody<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const instance = plainToInstance(DtoClass, req.body);
    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (errors.length > 0) {
      return errorResponse(res, formatErrors(errors), "Validation Error");
    }
    req.body = instance;
    next();
  };
}

/**
 * Validate query params against a DTO class.
 */
export function validateQuery<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const instance = plainToInstance(DtoClass, req.query);
    const errors = await validate(instance as object, { whitelist: true });
    if (errors.length > 0) {
      return errorResponse(res, formatErrors(errors), "Validation Error");
    }
    req.query = instance as any;
    next();
  };
}
