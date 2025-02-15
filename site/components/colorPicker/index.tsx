import React, {useContext, useEffect, useRef, useState} from "react";
import cn from "@edgedb/common/utils/classNames";
import {hexToHSB, hsbToHex, isValidHexColor} from "./utils";
import styles from "./colorPicker.module.scss";
import {ExampleThemeContext} from "pages/cloud";
import {ChangeEvent} from "react";

const defaultHSB = hexToHSB("#8280FF");

interface ColorPickerProps {
  label?: string;
  colorHex: string;
  setColorHex: React.Dispatch<React.SetStateAction<string>>;
}

const ColorPicker = ({label, colorHex, setColorHex}: ColorPickerProps) => {
  const {exampleTheme} = useContext(ExampleThemeContext);

  const [open, setOpen] = useState(false);

  const [hue, setHue] = useState(defaultHSB.hue);
  const [color, setColor] = useState({
    saturation: defaultHSB.saturation,
    brightness: defaultHSB.brightness,
  });

  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingColor, setIsDraggingColor] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);
  const hueRef = useRef<HTMLDivElement | null>(null);
  const colorRef = useRef<HTMLDivElement | null>(null);

  const handleHueChange = (
    e: React.MouseEvent<HTMLDivElement> | PointerEvent
  ) => {
    const sliderRect = hueRef.current?.getBoundingClientRect()!;
    let offsetX = e.clientX - sliderRect.left;

    // Constrain the offset to stay within the slider width
    offsetX = Math.min(sliderRect.width, Math.max(0, offsetX));

    const hue = Math.min(360, Math.max(0, (offsetX / sliderRect.width) * 360));
    setHue(hue);
    setColorHex(hsbToHex(hue, color.saturation, color.brightness));
  };

  const handleDragStartHue = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingHue(true);
    handleHueChange(e);
  };

  const handleDragHue = (
    e: React.PointerEvent<HTMLDivElement> | PointerEvent
  ) => {
    if (isDraggingHue) {
      e.preventDefault();
      handleHueChange(e);
    }
  };

  const handleColorChange = (
    e: React.MouseEvent<HTMLDivElement> | PointerEvent
  ) => {
    const panelRect = colorRef.current?.getBoundingClientRect()!;
    let offsetX = e.clientX - panelRect.left;
    let offsetY = e.clientY - panelRect.top;

    // Constrain the offsets to stay within the panel's width and height
    offsetX = Math.min(panelRect.width, Math.max(0, offsetX));
    offsetY = Math.min(panelRect.height, Math.max(0, offsetY));

    const saturation = (offsetX / panelRect.width) * 100;
    const brightness = 100 - (offsetY / panelRect.height) * 100;

    setColor({saturation, brightness});
    setColorHex(hsbToHex(hue, saturation, brightness));
  };

  const handleDragStartColor = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingColor(true);
    handleColorChange(e);
  };

  const handleDragColor = (
    e: React.PointerEvent<HTMLDivElement> | PointerEvent
  ) => {
    if (isDraggingColor) {
      e.preventDefault();
      handleColorChange(e);
    }
  };

  const updateColorInput = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value.replace(/[^0-9a-fA-F]/g, "");
    setColorHex(newColor);

    if (isValidHexColor(newColor)) {
      const {hue, saturation, brightness} = hexToHSB(newColor);
      setHue(hue);
      setColor({saturation, brightness});
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      handleDragHue(e);
      handleDragColor(e);
    };

    const handlePointerUp = () => {
      setIsDraggingHue(false);
      setIsDraggingColor(false);
    };

    if (isDraggingHue || isDraggingColor) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingHue, isDraggingColor]);

  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", listener, {capture: true});

    return () => {
      window.removeEventListener("click", listener, {capture: true});
    };
  }, [open]);

  useEffect(() => {
    if (isDraggingColor || isDraggingHue) {
      document.body.style.userSelect = "none";

      return () => {
        document.body.style.userSelect = "auto";
      };
    }
  }, [isDraggingColor, isDraggingHue]);

  return (
    <div
      className={cn(styles.container, {
        [styles.dark]: exampleTheme === "dark",
      })}
    >
      <label htmlFor="accentColor">{label}</label>
      <div>
        <div className={styles.inputWrapper}>
          <input
            name="accentColor"
            id="accentColor"
            value={colorHex}
            onChange={updateColorInput}
            className={styles.colorInput}
            maxLength={6}
          ></input>
          <div className={styles.hash}>#</div>
        </div>
        <div
          className={styles.color}
          style={{
            backgroundColor: `#${colorHex}`,
          }}
          onClick={() => setOpen(true)}
        ></div>
        <div
          ref={ref}
          className={cn(styles.colorPicker, {[styles.hide]: !open})}
        >
          <div
            className={styles.panel}
            onClick={handleColorChange}
            onPointerDown={handleDragStartColor}
            style={{
              backgroundColor: `hsl(${hue}, 100%, 50%)`,
            }}
            ref={colorRef}
          >
            <div
              className={styles.colorHandle}
              style={{
                left: (color.saturation / 100) * 100 + "%",
                top: ((100 - color.brightness) / 100) * 100 + "%",
                backgroundColor: `#${colorHex}`,
              }}
            />
          </div>
          <div
            className={styles.hue}
            onClick={handleHueChange}
            onPointerDown={handleDragStartHue}
            ref={hueRef}
          >
            <div
              className={styles.hueHandle}
              style={{
                left: `${(hue / 360) * 100}%`,
                backgroundColor: `hsl(${hue}, 100%, 50%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
