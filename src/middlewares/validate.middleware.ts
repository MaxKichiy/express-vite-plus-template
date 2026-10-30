import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { errors } from "../constants/error.constant";

export const ValidateSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.any().optional(),
});

type ValidateSchemaType = z.infer<typeof ValidateSchema>;

export function validate(schema: z.ZodType<ValidateSchemaType>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req);

    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({ success: false, error: errors.INVALID_DATA, details: errorMessages });
      return;
    }

    // Resetting body, params and query to accommodate z.coerce

    if (result.data["body"] !== undefined) {
      req.body = result.data["body"];
    }

    if (result.data["params"] !== undefined) {
      req.params = result.data["params"];
    }

    if (result.data["query"] !== undefined) {
      req.query = result.data["query"];
    }

    next();
  };
}
