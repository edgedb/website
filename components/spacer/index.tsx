interface SpacerProps {
  h?: string;
  w?: string;
  flex?: string;
}

export default function Spacer({h, w, flex}: SpacerProps) {
  return (
    <div style={{height: h || "0px", width: w || "0px", flexBasis: flex}} />
  );
}
