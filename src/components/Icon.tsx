interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
  size?: string;
}

export default function Icon({
  name,
  className = "",
  fill = false,
  size,
}: IconProps) {
  const style: React.CSSProperties = {};
  if (fill)
    style.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
  if (size) style.fontSize = size;

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={Object.keys(style).length ? style : undefined}
    >
      {name}
    </span>
  );
}
