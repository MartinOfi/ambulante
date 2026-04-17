const BULB_X = [80, 180, 280, 380, 480, 580, 680, 780, 880, 980, 1080, 1180, 1280, 1380] as const;

export function StringLights() {
  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      height="52"
      viewBox="0 0 1440 52"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M-20 12 Q180 30 360 12 Q540 -6 720 12 Q900 30 1080 12 Q1260 -6 1460 12"
        stroke="#92400E"
        strokeWidth="1.5"
        fill="none"
        opacity="0.75"
      />
      {BULB_X.map((x, i) => {
        const cy = i % 2 === 0 ? 28 : 14;
        const wireY = i % 2 === 0 ? 18 : 5;
        return (
          <g key={x}>
            <line
              x1={x}
              y1={wireY}
              x2={x}
              y2={cy - 4}
              stroke="#92400E"
              strokeWidth="1"
              opacity="0.75"
            />
            <ellipse cx={x} cy={cy + 4} rx="5" ry="7" fill="#FCD34D" opacity="0.88" />
            <ellipse cx={x} cy={cy + 4} rx="10" ry="12" fill="#FCD34D" opacity="0.12" />
          </g>
        );
      })}
    </svg>
  );
}
