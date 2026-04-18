import { useEffect, useRef } from 'react';

interface AnimatedEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  flow_kw: number;
  highlighted: boolean;
  animFrame: number;
}

const AnimatedEdge = ({ x1, y1, x2, y2, flow_kw, highlighted, animFrame }: AnimatedEdgeProps) => {
  const absFlow = Math.abs(flow_kw);
  const intensity = Math.min(absFlow / 40, 1);

  // Direction: positive = from->to (green), negative = to->from (red)
  const isGreen = flow_kw >= 0;
  const baseColor = isGreen ? '34, 197, 94' : '239, 68, 68';
  const strokeAlpha = highlighted ? 0.3 + intensity * 0.5 : 0.12 + intensity * 0.2;
  const strokeColor = `rgba(${baseColor}, ${strokeAlpha})`;

  // Calculate line length and angle for particles
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 1) return null;

  // Particle count based on flow intensity
  const particleCount = Math.max(1, Math.round(intensity * 4));
  const speed = 0.8 + intensity * 1.5; // pixels per frame

  // Generate particles along the line
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const offset = (i / particleCount) * length;
    const pos = ((animFrame * speed + offset) % length) / length;
    const actualPos = isGreen ? pos : 1 - pos; // reverse direction for consumption

    const px = x1 + dx * actualPos;
    const py = y1 + dy * actualPos;
    const radius = 2 + intensity * 2;
    const alpha = 0.4 + intensity * 0.5;

    particles.push(
      <circle
        key={i}
        cx={px}
        cy={py}
        r={radius}
        fill={`rgba(${baseColor}, ${alpha})`}
        className="pointer-events-none"
      />
    );
  }

  // Glow for high-intensity flows
  const glowId = `glow-${x1}-${y1}-${x2}-${y2}`;

  return (
    <g className="pointer-events-none">
      {intensity > 0.4 && (
        <defs>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      {/* Base line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={absFlow < 0.5 ? 'hsl(220, 15%, 22%)' : strokeColor}
        strokeWidth={highlighted ? 2.5 : 1.5 + intensity}
        strokeLinecap="round"
        filter={intensity > 0.4 && highlighted ? `url(#${glowId})` : undefined}
      />
      {/* Animated particles */}
      {absFlow > 0.5 && particles}
      {/* Flow label on highlighted edge */}
      {highlighted && absFlow > 0.5 && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          textAnchor="middle"
          fontSize={9}
          fontWeight={600}
          fontFamily="monospace"
          fill={`rgba(${baseColor}, 0.9)`}
          className="pointer-events-none"
        >
          {absFlow.toFixed(1)} kW
        </text>
      )}
    </g>
  );
};

export default AnimatedEdge;
