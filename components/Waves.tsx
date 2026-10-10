// Animated waves on both sides of the page. The source wave is drawn
// horizontally (crest on top), so it's rotated 90° to run down the left edge,
// and the right panel mirrors it with CSS.

const WAVE_PATH =
  "M-10,10C30.544871794871796,10.416666666666666,105.60897435897436,15.541666666666668,184.6153846153846,12C263.62179487179486,8.458333333333332,292.3076923076923,-10.333333333333332,369.2307692307692,-7C446.15384615384613,-3.666666666666667,476.9230769230769,28.208333333333332,553.8461538461538,28C630.7692307692307,27.791666666666668,661.5384615384615,-9.25,738.4615384615385,-8C815.3846153846154,-6.75,846.1538461538462,34.208333333333336,923.0769230769231,34C1000,33.791666666666664,1030.7692307692307,-11.083333333333334,1107.6923076923076,-9C1184.6153846153845,-6.916666666666666,1215.3846153846155,44.208333333333336,1292.3076923076924,44C1369.2307692307693,43.791666666666664,1400,-6.875,1476.923076923077,-10C1553.8461538461538,-13.125,1584.6153846153845,26.291666666666668,1661.5384615384614,29C1738.4615384615383,31.708333333333332,1769.2307692307693,1.9583333333333333,1846.1538461538462,3C1923.076923076923,4.041666666666667,1953.8461538461538,35.666666666666664,2030.7692307692307,34C2107.6923076923076,32.333333333333336,2138.461538461538,-7.291666666666666,2215.3846153846152,-5C2292.3076923076924,-2.7083333333333335,2309.455128205128,-39.375,2400,45C2490.544871794872,129.375,3254.1666666666665,221.875,2650,400C2045.8333333333335,578.125,156.25,795.8333333333334,-500,900";

// Original layer offsets: the group is shifted by (9.7, 239.5) and each layer
// by a further 58 / 116 / 174 units.
const ORIGIN = { x: 9.7, y: 239.5 };
const SHORE = 480; // How far in (in viewBox units) the rotated waves sit.
const VIEW = { width: 250, height: 2400 };

/** Rotate a horizontal-wave layer 90° clockwise: (x, y) → (SHORE - y, x). */
function rotate(offsetY: number) {
  return `matrix(0,1,-1,0,${SHORE - ORIGIN.y - offsetY},${ORIGIN.x})`;
}

function WavePanel({ side }: { side: "left" | "right" }) {
  const grad = `wave-grad-${side}`;
  const glow = `wave-glow-${side}`;
  return (
    <div className={`wave-panel wave-panel--${side}`} aria-hidden>
      <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMinYMin slice">
        <defs>
          <linearGradient id={grad} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--wave-color)" }} />
            <stop offset="100%" style={{ stopColor: "var(--wave-dark)" }} />
          </linearGradient>
          <filter id={glow} x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>

        {/* Foam: the outermost, translucent white crest. */}
        <g className="wave-layer wave-layer--foam">
          <path d={WAVE_PATH} transform={rotate(58)} fill="#fff" opacity={0.07} />
        </g>
        <g className="wave-layer wave-layer--mid">
          <path d={WAVE_PATH} transform={rotate(116)} fill={`url(#${grad})`} opacity={0.53} />
        </g>
        <g className="wave-glow">
          <path
            d={WAVE_PATH}
            transform={rotate(174)}
            fill="none"
            stroke="var(--wave-color)"
            strokeWidth={14}
            filter={`url(#${glow})`}
          />
        </g>
        <g className="wave-layer wave-layer--front">
          <path d={WAVE_PATH} transform={rotate(174)} fill={`url(#${grad})`} />
        </g>
      </svg>
    </div>
  );
}

export default function Waves() {
  return (
    <>
      <WavePanel side="left" />
      <WavePanel side="right" />
    </>
  );
}
