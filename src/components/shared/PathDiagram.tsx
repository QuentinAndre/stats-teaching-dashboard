/**
 * Reusable SVG path diagram for simple mediation models.
 *
 * Layout (viewBox 500 × 280):
 *
 *          M (top center)
 *         / \
 *       a/   \b
 *       /     \
 *   X (left) --c'-- Y (right)
 *
 * Supports: coefficient labels, highlighting, and an optional
 * confounder variable U with dashed arrows to M and Y.
 */

interface PathDiagramProps {
  width?: number;
  height?: number;
  // Which paths to show
  showAPath?: boolean;
  showBPath?: boolean;
  showCPrimePath?: boolean;
  showTotalPath?: boolean; // Shows c instead of c' on the X→Y path
  // Coefficient labels (empty string = show arrow with no label)
  aLabel?: string;
  bLabel?: string;
  cPrimeLabel?: string;
  cLabel?: string;
  // Confounder
  showConfounder?: boolean;
  confounderLabel?: string;
  confounderToMLabel?: string;
  confounderToYLabel?: string;
  // Highlighting
  highlightPaths?: ('a' | 'b' | 'cPrime' | 'c')[];
  // Variable labels
  xLabel?: string;
  mLabel?: string;
  yLabel?: string;
  // Extra descriptive labels below boxes
  xDesc?: string;
  mDesc?: string;
  yDesc?: string;
}

// Arrow marker definition IDs
const MARKER_DEFAULT = 'arrow-default';
const MARKER_HIGHLIGHT = 'arrow-highlight';
const MARKER_DASHED = 'arrow-dashed';

export default function PathDiagram({
  width = 500,
  height = 280,
  showAPath = true,
  showBPath = true,
  showCPrimePath = true,
  showTotalPath = false,
  aLabel,
  bLabel,
  cPrimeLabel,
  cLabel,
  showConfounder = false,
  confounderLabel = 'U (unmeasured)',
  confounderToMLabel,
  confounderToYLabel,
  highlightPaths = [],
  xLabel = 'X',
  mLabel = 'M',
  yLabel = 'Y',
  xDesc,
  mDesc,
  yDesc,
}: PathDiagramProps) {
  // Box dimensions and positions
  const boxW = 110;
  const boxH = 44;
  const boxR = 6;

  // Node centers
  const xCenter = { x: 90, y: 220 };
  const mCenter = { x: 250, y: 55 };
  const yCenter = { x: 410, y: 220 };
  const uCenter = { x: 410, y: 55 };

  const isHighlighted = (path: string) => highlightPaths.includes(path as 'a' | 'b' | 'cPrime' | 'c');

  // Compute arrow endpoints (from box edge, not center)
  function edgePoint(
    from: { x: number; y: number },
    to: { x: number; y: number },
    w: number,
    h: number
  ): { x: number; y: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    // Find intersection with box edge
    const hw = w / 2;
    const hh = h / 2;
    const tanA = Math.abs(Math.tan(angle));
    let ex: number, ey: number;
    if (tanA * hw < hh) {
      // Exits through left/right edge
      ex = Math.sign(dx) * hw;
      ey = Math.sign(dx) * hw * Math.tan(angle);
    } else {
      // Exits through top/bottom edge
      ey = Math.sign(dy) * hh;
      ex = Math.sign(dy) * hh / Math.tan(angle);
    }
    return { x: from.x + ex, y: from.y + ey };
  }

  // Arrow endpoints
  const aStart = edgePoint(xCenter, mCenter, boxW, boxH);
  const aEnd = edgePoint(mCenter, xCenter, boxW, boxH);
  const bStart = edgePoint(mCenter, yCenter, boxW, boxH);
  const bEnd = edgePoint(yCenter, mCenter, boxW, boxH);
  const cStart = edgePoint(xCenter, yCenter, boxW, boxH);
  const cEnd = edgePoint(yCenter, xCenter, boxW, boxH);

  // Confounder arrow endpoints (from ellipse edge approximation)
  const uRadiusX = 65;
  const uRadiusY = 20;
  const uToMAngle = Math.atan2(mCenter.y - uCenter.y, mCenter.x - uCenter.x);
  const uToMStart = {
    x: uCenter.x + uRadiusX * Math.cos(uToMAngle),
    y: uCenter.y + uRadiusY * Math.sin(uToMAngle),
  };
  const uToMEnd = edgePoint(mCenter, uCenter, boxW, boxH);

  const uToYAngle = Math.atan2(yCenter.y - uCenter.y, yCenter.x - uCenter.x);
  const uToYStart = {
    x: uCenter.x + uRadiusX * Math.cos(uToYAngle),
    y: uCenter.y + uRadiusY * Math.sin(uToYAngle),
  };
  const uToYEnd = edgePoint(yCenter, uCenter, boxW, boxH);

  // Label positions at arrow midpoints
  function midLabel(
    start: { x: number; y: number },
    end: { x: number; y: number },
    offset: number = -10
  ): { x: number; y: number } {
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    // Perpendicular offset
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;
    return { x: mx + nx * offset, y: my + ny * offset };
  }

  const aLabelPos = midLabel(aStart, aEnd, -12);
  const bLabelPos = midLabel(bStart, bEnd, -12);
  const cLabelPos = midLabel(cStart, cEnd, -12);
  const uToMLabelPos = midLabel(uToMStart, uToMEnd, -10);
  const uToYLabelPos = midLabel(uToYStart, uToYEnd, 14);

  const defaultColor = 'var(--text-secondary, #6b7280)';
  const highlightColor = 'var(--primary, #4361ee)';
  const dashedColor = '#ea580c';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: width, width: '100%' }}
    >
      {/* Arrow marker definitions */}
      <defs>
        <marker
          id={MARKER_DEFAULT}
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={defaultColor} />
        </marker>
        <marker
          id={MARKER_HIGHLIGHT}
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={highlightColor} />
        </marker>
        <marker
          id={MARKER_DASHED}
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={dashedColor} />
        </marker>
      </defs>

      {/* Confounder (behind other elements) */}
      {showConfounder && (
        <g>
          {/* U ellipse */}
          <ellipse
            cx={uCenter.x}
            cy={uCenter.y}
            rx={uRadiusX}
            ry={uRadiusY}
            fill="none"
            stroke={dashedColor}
            strokeWidth={1.5}
            strokeDasharray="5,4"
          />
          <text
            x={uCenter.x}
            y={uCenter.y + 5}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill={dashedColor}
          >
            {confounderLabel}
          </text>

          {/* U → M arrow */}
          <line
            x1={uToMStart.x}
            y1={uToMStart.y}
            x2={uToMEnd.x}
            y2={uToMEnd.y}
            stroke={dashedColor}
            strokeWidth={1.5}
            strokeDasharray="5,4"
            markerEnd={`url(#${MARKER_DASHED})`}
          />
          {confounderToMLabel && (
            <text
              x={uToMLabelPos.x}
              y={uToMLabelPos.y}
              textAnchor="middle"
              fontSize={11}
              fill={dashedColor}
              fontWeight={500}
            >
              {confounderToMLabel}
            </text>
          )}

          {/* U → Y arrow */}
          <line
            x1={uToYStart.x}
            y1={uToYStart.y}
            x2={uToYEnd.x}
            y2={uToYEnd.y}
            stroke={dashedColor}
            strokeWidth={1.5}
            strokeDasharray="5,4"
            markerEnd={`url(#${MARKER_DASHED})`}
          />
          {confounderToYLabel && (
            <text
              x={uToYLabelPos.x}
              y={uToYLabelPos.y}
              textAnchor="middle"
              fontSize={11}
              fill={dashedColor}
              fontWeight={500}
            >
              {confounderToYLabel}
            </text>
          )}
        </g>
      )}

      {/* Path arrows */}
      {showAPath && (
        <g>
          <line
            x1={aStart.x}
            y1={aStart.y}
            x2={aEnd.x}
            y2={aEnd.y}
            stroke={isHighlighted('a') ? highlightColor : defaultColor}
            strokeWidth={isHighlighted('a') ? 2.5 : 2}
            markerEnd={`url(#${isHighlighted('a') ? MARKER_HIGHLIGHT : MARKER_DEFAULT})`}
          />
          {aLabel !== undefined && (
            <text
              x={aLabelPos.x}
              y={aLabelPos.y}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fontStyle="italic"
              fill={isHighlighted('a') ? highlightColor : 'var(--text-primary, #333)'}
            >
              {aLabel}
            </text>
          )}
        </g>
      )}

      {showBPath && (
        <g>
          <line
            x1={bStart.x}
            y1={bStart.y}
            x2={bEnd.x}
            y2={bEnd.y}
            stroke={isHighlighted('b') ? highlightColor : defaultColor}
            strokeWidth={isHighlighted('b') ? 2.5 : 2}
            markerEnd={`url(#${isHighlighted('b') ? MARKER_HIGHLIGHT : MARKER_DEFAULT})`}
          />
          {bLabel !== undefined && (
            <text
              x={bLabelPos.x}
              y={bLabelPos.y}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fontStyle="italic"
              fill={isHighlighted('b') ? highlightColor : 'var(--text-primary, #333)'}
            >
              {bLabel}
            </text>
          )}
        </g>
      )}

      {(showCPrimePath || showTotalPath) && (
        <g>
          <line
            x1={cStart.x}
            y1={cStart.y}
            x2={cEnd.x}
            y2={cEnd.y}
            stroke={
              isHighlighted('cPrime') || isHighlighted('c')
                ? highlightColor
                : defaultColor
            }
            strokeWidth={
              isHighlighted('cPrime') || isHighlighted('c') ? 2.5 : 2
            }
            strokeDasharray={showTotalPath ? undefined : '6,4'}
            markerEnd={`url(#${
              isHighlighted('cPrime') || isHighlighted('c')
                ? MARKER_HIGHLIGHT
                : MARKER_DEFAULT
            })`}
          />
          {showTotalPath && cLabel !== undefined && (
            <text
              x={cLabelPos.x}
              y={cLabelPos.y}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fontStyle="italic"
              fill={
                isHighlighted('c')
                  ? highlightColor
                  : 'var(--text-primary, #333)'
              }
            >
              {cLabel}
            </text>
          )}
          {!showTotalPath && cPrimeLabel !== undefined && (
            <text
              x={cLabelPos.x}
              y={cLabelPos.y}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fontStyle="italic"
              fill={
                isHighlighted('cPrime')
                  ? highlightColor
                  : 'var(--text-primary, #333)'
              }
            >
              {cPrimeLabel}
            </text>
          )}
        </g>
      )}

      {/* Variable boxes */}
      {/* X box */}
      <rect
        x={xCenter.x - boxW / 2}
        y={xCenter.y - boxH / 2}
        width={boxW}
        height={boxH}
        rx={boxR}
        fill="var(--bg-primary, #fff)"
        stroke="var(--border, #d1d5db)"
        strokeWidth={1.5}
      />
      <text
        x={xCenter.x}
        y={xCenter.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={15}
        fontWeight={700}
        fill="var(--text-primary, #333)"
      >
        {xLabel}
      </text>
      {xDesc && (
        <text
          x={xCenter.x}
          y={xCenter.y + boxH / 2 + 16}
          textAnchor="middle"
          fontSize={10}
          fill="var(--text-secondary, #6b7280)"
        >
          {xDesc}
        </text>
      )}

      {/* M box */}
      <rect
        x={mCenter.x - boxW / 2}
        y={mCenter.y - boxH / 2}
        width={boxW}
        height={boxH}
        rx={boxR}
        fill="var(--bg-primary, #fff)"
        stroke="var(--border, #d1d5db)"
        strokeWidth={1.5}
      />
      <text
        x={mCenter.x}
        y={mCenter.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={15}
        fontWeight={700}
        fill="var(--text-primary, #333)"
      >
        {mLabel}
      </text>
      {mDesc && (
        <text
          x={mCenter.x}
          y={mCenter.y - boxH / 2 - 8}
          textAnchor="middle"
          fontSize={10}
          fill="var(--text-secondary, #6b7280)"
        >
          {mDesc}
        </text>
      )}

      {/* Y box */}
      <rect
        x={yCenter.x - boxW / 2}
        y={yCenter.y - boxH / 2}
        width={boxW}
        height={boxH}
        rx={boxR}
        fill="var(--bg-primary, #fff)"
        stroke="var(--border, #d1d5db)"
        strokeWidth={1.5}
      />
      <text
        x={yCenter.x}
        y={yCenter.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={15}
        fontWeight={700}
        fill="var(--text-primary, #333)"
      >
        {yLabel}
      </text>
      {yDesc && (
        <text
          x={yCenter.x}
          y={yCenter.y + boxH / 2 + 16}
          textAnchor="middle"
          fontSize={10}
          fill="var(--text-secondary, #6b7280)"
        >
          {yDesc}
        </text>
      )}
    </svg>
  );
}
