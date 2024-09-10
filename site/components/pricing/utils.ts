import Fraction from "fraction.js";
import {PricingData, PricingTiers} from "./types";
import type {BillableData, Resource} from "./types";

const secondsInMonth = 60 * 60 * 24 * 31;

export async function getBillableData(): Promise<BillableData> {
  const res = await fetch(process.env.EDGEDB_PRICING_URL!);

  const data = PricingData.parse(await res.json());

  const computeBillable = data.billables.find(
    (billable) => billable.name == "compute"
  )!;

  // Prices we show on the website are prices for aws-us-east-2 region.
  const defaultProPrices = data.prices[PricingTiers.enum.Pro]?.[
    "aws-us-east-2"
  ]!;

  const computeUnitPrice = parseFloat(
    defaultProPrices.find(
      (region: any) => region.billable == computeBillable.id
    )?.unit_price_cents!
  );

  const unitsBundled = defaultProPrices.reduce(
    (acc: {[key: string]: string}, unit) => {
      if (unit.units_bundled !== "0") {
        const billable = data.billables.find(
          (billable) => billable.id === unit.billable
        );

        billable?.resources?.map((resource) => {
          acc[billable.name] =
            (acc[billable.name] ? acc[billable.name] + " + " : "") +
            new Fraction(unit.units_bundled)
              .mul(new Fraction(resource.display_increment))
              .toFraction() +
            resource.display_unit +
            " of " +
            resource.name;
        });
      }

      return acc;
    },
    {}
  );

  const unitPrices = defaultProPrices.reduce((prices, unit) => {
    const billable = data.billables.find(
      (billable) => billable.id === unit.billable
    )!;

    const unitMultiplier =
      billable.kind === "Allocated"
        ? secondsInMonth / billable.billing_increment_seconds!
        : 1;

    prices[billable.name] = `$${(
      Math.ceil(parseFloat(unit.unit_price_cents) * unitMultiplier) / 100
    ).toFixed(2)}/${billable.resources[0].display_unit}`;

    return prices;
  }, {} as {[key: string]: string});

  return {computeBillable, computeUnitPrice, unitsBundled, unitPrices};
}

// Gives back the resources in the string form, for example: 1 vCPU, 8 GiB RAM
export const formatResources = (resources: Resource[], factor: string) => {
  return resources.reduce((acc, resource, index) => {
    const resourceAmount = new Fraction(resource.display_increment)
      .mul(new Fraction(factor))
      .toFraction(true);

    return (
      acc +
      resourceAmount +
      " " +
      resource.display_unit +
      (index < resources.length - 1 ? ", " : "")
    );
  }, "");
};
