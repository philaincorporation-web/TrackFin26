import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

export const companySettingsSchema = z.object({
  legalName: z.string().trim().min(2, "Raison sociale requise").max(160),
  address: optionalText(300),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.email("Adresse e-mail invalide")]))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  rccm: optionalText(60),
  nif: optionalText(60),
  bankDetails: optionalText(500),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Code ISO à 3 lettres (ex. XAF)"),
  invoicePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,6}$/, "2 à 6 lettres majuscules (ex. FAC)"),
  invoicePadding: z.coerce.number().int().min(3, "Minimum 3").max(6, "Maximum 6"),
  payrollPortalEnabled: z.boolean(),
});

export type CompanySettingsInput = z.input<typeof companySettingsSchema>;
export type CompanySettingsData = z.output<typeof companySettingsSchema>;
