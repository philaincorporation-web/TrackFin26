"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companySettingsSchema,
  type CompanySettingsData,
  type CompanySettingsInput,
} from "@/lib/validation/settings";
import { Button, Field, FormMessage, Input, Textarea, invalidProps } from "@/components/ui/primitives";
import { updateSettingsAction } from "./actions";

type Defaults = {
  legalName: string;
  address: string;
  phone: string;
  email: string;
  rccm: string;
  nif: string;
  bankDetails: string;
  currency: string;
  invoicePrefix: string;
  invoicePadding: number;
  payrollPortalEnabled: boolean;
};

const formatDateTime = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Africa/Libreville",
});

export function SettingsForm({
  defaults,
  editable,
  lastUpdate,
}: {
  defaults: Defaults;
  editable: boolean;
  lastUpdate: string | null;
}) {
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<CompanySettingsInput, unknown, CompanySettingsData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: defaults,
  });

  const prefix = useWatch({ control, name: "invoicePrefix" }) || "FAC";
  const padding = Number(useWatch({ control, name: "invoicePadding" })) || 3;
  const example = `${String(prefix).toUpperCase()}-${new Date().getFullYear()}-${"1".padStart(padding, "0")}`;

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateSettingsAction(values);
      if (result.ok) {
        reset(undefined, { keepValues: true });
        setMessage({ tone: "success", text: "Paramètres enregistrés." });
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  });

  const field = (name: keyof Defaults) => ({
    id: name,
    disabled: !editable,
    ...invalidProps(name, errors[name]?.message),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {!editable && (
        <FormMessage tone="success">Consultation seule : seul l&apos;administrateur général peut modifier ces informations.</FormMessage>
      )}
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      <fieldset className="space-y-4">
        <legend className="mb-2 text-base font-semibold">Identité de l&apos;entreprise</legend>
        <Field id="legalName" label="Raison sociale" error={errors.legalName?.message}>
          <Input {...field("legalName")} {...register("legalName")} />
        </Field>
        <Field id="address" label="Adresse" error={errors.address?.message}>
          <Textarea rows={2} {...field("address")} {...register("address")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label="Téléphone" error={errors.phone?.message}>
            <Input type="tel" {...field("phone")} {...register("phone")} />
          </Field>
          <Field id="email" label="E-mail" error={errors.email?.message}>
            <Input type="email" {...field("email")} {...register("email")} />
          </Field>
          <Field id="rccm" label="RCCM" hint="À confirmer par DigiWomen School" error={errors.rccm?.message}>
            <Input {...field("rccm")} {...register("rccm")} />
          </Field>
          <Field id="nif" label="NIF" hint="À confirmer par DigiWomen School" error={errors.nif?.message}>
            <Input {...field("nif")} {...register("nif")} />
          </Field>
        </div>
        <Field
          id="bankDetails"
          label="Coordonnées bancaires (affichées sur les factures)"
          error={errors.bankDetails?.message}
        >
          <Textarea rows={3} {...field("bankDetails")} {...register("bankDetails")} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-base font-semibold">Facturation</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="currency" label="Devise" hint="Code ISO, ex. XAF" error={errors.currency?.message}>
            <Input maxLength={3} {...field("currency")} {...register("currency")} />
          </Field>
          <Field id="invoicePrefix" label="Préfixe des factures" error={errors.invoicePrefix?.message}>
            <Input maxLength={6} {...field("invoicePrefix")} {...register("invoicePrefix")} />
          </Field>
          <Field id="invoicePadding" label="Chiffres du compteur" error={errors.invoicePadding?.message}>
            <Input type="number" min={3} max={6} {...field("invoicePadding")} {...register("invoicePadding")} />
          </Field>
        </div>
        <p className="text-sm text-muted">
          Exemple de numéro : <span className="font-mono font-semibold text-ink">{example}</span>
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-base font-semibold">Paie</legend>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand-600"
            disabled={!editable}
            {...register("payrollPortalEnabled")}
          />
          <span>
            <span className="font-medium">Portail salarié activé</span>
            <span className="block text-muted">Chaque collaborateur peut consulter ses propres bulletins.</span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-xs text-muted">
          {lastUpdate ? `Dernière modification : ${formatDateTime.format(new Date(lastUpdate))}` : "Jamais enregistrés"}
        </p>
        {editable && (
          <Button type="submit" pending={pending} disabled={!isDirty}>
            Enregistrer
          </Button>
        )}
      </div>
    </form>
  );
}
