interface SkelProps {
  w?: string | number;
  h?: number;
  r?: number;
  className?: string;
}

export function Skel({ w = "100%", h = 12, r = 8, className }: SkelProps) {
  return (
    <div
      className={`ab-skel${className ? ` ${className}` : ""}`}
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: `${h}px`,
        borderRadius: `${r}px`,
      }}
    />
  );
}
