"use client";

export function isTouchDevice() {
  return (
    typeof window != undefined && window.matchMedia("(pointer: coarse)").matches
  );
}
