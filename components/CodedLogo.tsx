// Inline SVG bracketed CODED wordmark. Replaces the misnamed
// /brand/coded-logo-white.png that was actually the AI App Developer
// Bootcamp logo. Controlled entirely by props; works in App Router pages,
// Satori (next/og ImageResponse), and Remotion compositions.
//
// viewBox is fixed so all consumers can size by width and the rectangle +
// text scale together.

type Props = {
  width: number;
  color?: string;
  /** Stroke weight as a fraction of viewBox height. Default 0.07. */
  strokeRatio?: number;
};

const VB_W = 280;
const VB_H = 100;

export function CodedLogo({ width, color = "#FFFFFF", strokeRatio = 0.07 }: Props) {
  const stroke = VB_H * strokeRatio;
  const inset = stroke / 2;
  const height = (VB_H / VB_W) * width;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <rect
        x={inset}
        y={inset}
        width={VB_W - stroke}
        height={VB_H - stroke}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
      />
      <text
        x={VB_W / 2}
        y={VB_H * 0.74}
        textAnchor="middle"
        fill={color}
        fontSize={VB_H * 0.62}
        fontWeight={900}
        fontFamily="DM Sans, Helvetica, Arial, sans-serif"
        letterSpacing="2"
      >
        CODED
      </text>
    </svg>
  );
}
