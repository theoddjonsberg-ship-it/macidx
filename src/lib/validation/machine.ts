import { z } from "zod";

export const addMachineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Namn krävs")
    .max(200, "Max 200 tecken"),
  brand: z
    .string()
    .trim()
    .max(100, "Max 100 tecken")
    .optional()
    .or(z.literal("")),
  model: z
    .string()
    .trim()
    .max(100, "Max 100 tecken")
    .optional()
    .or(z.literal("")),
  serial_number: z
    .string()
    .trim()
    .max(100, "Max 100 tecken")
    .optional()
    .or(z.literal("")),
  year: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1900 && val <= new Date().getFullYear() + 1), {
      message: "Ogiltigt årtal",
    }),
  type: z
    .string()
    .optional()
    .or(z.literal("")),
  fuel_type: z
    .string()
    .optional()
    .or(z.literal("")),
  operating_hours: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Drifttimmar måste vara 0 eller mer",
    }),
  weight_kg: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Vikt måste vara 0 eller mer",
    }),
});

export type AddMachineInput = z.infer<typeof addMachineSchema>;
