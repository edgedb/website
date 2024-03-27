import z from "zod";

export const PricingTiers = z.enum(["Free", "Pro"]);

const Resource = z.object({
  name: z.string(),
  display_unit: z.string(),
  display_increment: z.string(),
});

const Billable = z.object({
  id: z.string(),
  name: z.string(),
  display_name: z.string(),
  kind: z.enum(["Allocated", "Metered"]),
  display_unit: z.string(),
  billing_increment_seconds: z.number().nullable(),
  billing_increment_display: z.string().nullable(),
  selectable_factors_display: z.array(z.string()).nullable(),
  resources: z.array(Resource),
  default_org_limits: z
    .array(
      z.object({
        tier: PricingTiers,
        limit: z.string(),
      })
    )
    .nullable(),
  default_instance_limits: z
    .array(
      z.object({
        tier: PricingTiers,
        limit: z.string(),
      })
    )
    .nullable(),
});

export const PricingData = z.object({
  billables: z.array(Billable),
  prices: z.record(
    PricingTiers,
    z.record(
      z.string(),
      z
        .array(
          z.object({
            billable: z.string(),
            unit_price_cents: z.string(),
            units_bundled: z.string(),
          })
        )
        .nullable()
    )
  ),
});

export type Billable = z.infer<typeof Billable>;
export type Resource = z.infer<typeof Resource>;

export interface BillableData {
  computeBillable: Billable;
  computeUnitPrice: number;
  unitsBundled: {[key: string]: string};
  unitPrices: {[key: string]: string};
}
