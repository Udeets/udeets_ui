"use client";

interface UDeetsLogoProps {
  className?: string;
  color?: string;
}

const UDeetsLogo = ({
  className = "",
  color = "#0D5F8F",
}: UDeetsLogoProps) => {
  return (
    <svg
      viewBox="0 0 600 200"
      width="144"
      height="48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="uDeets logo"
      role="img"
      preserveAspectRatio="xMinYMid meet"
      style={{ display: "block" }}
    >
      <text
        x="0"
        y="150"
        fill={color}
        fontSize="150"
        fontWeight="700"
        letterSpacing="-3"
        fontFamily="
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          Segoe UI,
          Roboto
        "
      >
        uDeets
      </text>
    </svg>
  );
};

export default UDeetsLogo;
