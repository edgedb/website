import React, {useState} from "react";
import Fraction from "fraction.js";
import {formatResources} from "../utils";
import type {BillableData} from "../types";
import styles from "./slider.module.scss";

type PricingSliderProps = Pick<
  BillableData,
  "computeBillable" | "computeUnitPrice"
>;

const PricingSlider = ({
  computeBillable: billable,
  computeUnitPrice: price,
}: PricingSliderProps) => {
  const [selectedSliderValue, setSelectedSliderValue] = useState(0);

  const billableDisplayUnit = billable.display_unit;
  const factors = billable.selectable_factors_display!;
  const resources = billable.resources;

  const selectedFactor = factors![selectedSliderValue];

  const startingPrice = Math.ceil(
    31 * 24 * price * new Fraction(selectedFactor).valueOf()
  );

  const formattedResources = formatResources(resources, selectedFactor);

  const progress = (selectedSliderValue / (factors.length - 1)) * 100;

  return (
    <div className={styles.container}>
      <p className={styles.title}>
        Starts at
        <span className={styles.price}>
          {" "}
          ${(startingPrice / 100).toFixed(2)}
        </span>
        <span className={styles.small}> /month</span>
      </p>
      <input
        type="range"
        min={0}
        max={factors.length - 1}
        step={1}
        value={selectedSliderValue}
        onChange={(e) => setSelectedSliderValue(e.target.valueAsNumber)}
        className={styles.slider}
        id="pricingSlider"
        style={{
          backgroundImage: `linear-gradient(to right, #279474 ${progress}%, transparent ${progress}%),
          linear-gradient(var(--grey40), var(--grey40))`,
        }}
      />
      <p className={styles.subtitle}>
        {`${selectedFactor} ${billableDisplayUnit}`}
        {selectedFactor === "1" ? " " : "s "}
        <span>({formattedResources})</span>
      </p>
    </div>
  );
};

export default PricingSlider;
