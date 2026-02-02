export default function DegreesOfFreedom() {
  // Tree diagram dimensions
  const width = 700;
  const height = 380;
  const margin = { top: 40, right: 20, bottom: 40, left: 20 };

  // Simple tree structure showing branching analysis paths
  const treeData = {
    root: { x: width / 2, y: margin.top, label: 'Start Analysis' },
    level1: [
      { x: width * 0.25, y: 100, label: 'Keep outliers' },
      { x: width * 0.75, y: 100, label: 'Remove outliers' },
    ],
    level2: [
      { x: width * 0.125, y: 180, label: 'No covariate' },
      { x: width * 0.375, y: 180, label: 'Add covariate' },
      { x: width * 0.625, y: 180, label: 'No covariate' },
      { x: width * 0.875, y: 180, label: 'Add covariate' },
    ],
    level3: [
      { x: width * 0.0625, y: 260, label: 'All data' },
      { x: width * 0.1875, y: 260, label: 'Males only' },
      { x: width * 0.3125, y: 260, label: 'All data' },
      { x: width * 0.4375, y: 260, label: 'Males only' },
      { x: width * 0.5625, y: 260, label: 'All data' },
      { x: width * 0.6875, y: 260, label: 'Males only' },
      { x: width * 0.8125, y: 260, label: 'All data' },
      { x: width * 0.9375, y: 260, label: 'Males only' },
    ],
  };

  return (
    <div className="section-intro">
      <h2>The Garden of Forking Paths</h2>

      <p className="intro-text">
        Recall from the NHST module that setting α = 0.05 only controls the false-positive
        rate when you perform <strong>one pre-specified test</strong>. The moment you run
        multiple tests—whether on different outcomes, subgroups, or data transformations—the
        probability of finding at least one "significant" result by chance increases dramatically.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        Statistician Andrew Gelman and economist Eric Loken called this the <em>"garden of
        forking paths."</em> Every analytic decision is a fork in the road. Even if you only
        report one analysis, the fact that you <em>could have</em> analyzed the data differently
        means you've implicitly tested multiple hypotheses.
      </p>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Common Researcher Degrees of Freedom</h3>

      <p style={{ lineHeight: 1.7 }}>
        Simmons, Nelson, and Simonsohn (2011) identified several common practices that
        inflate false-positive rates:
      </p>

      <ol style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.8 }}>
        <li>
          <strong>Outlier exclusion rules:</strong> Remove "outliers" using various
          criteria (±2.5 SD, ±3 SD, IQR rule, etc.)—or don't remove them at all
        </li>
        <li>
          <strong>Covariate choices:</strong> Control for variables like age, gender,
          or other measures—which ones you include can change results
        </li>
        <li>
          <strong>Subgroup analyses:</strong> Split the data by gender, age groups,
          or other factors and report whichever subgroup shows the effect
        </li>
        <li>
          <strong>Outcome selection:</strong> Collect multiple dependent variables
          and report the one that "works"
        </li>
        <li>
          <strong>Data transformations:</strong> Log-transform, square-root transform,
          or otherwise transform variables to achieve normality (or significance)
        </li>
        <li>
          <strong>Sample size flexibility:</strong> Collect data until p &lt; .05,
          or "collect more data if p is close"
        </li>
      </ol>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Visualizing the Forking Paths</h3>

      <p style={{ lineHeight: 1.7 }}>
        Each analytic decision multiplies the number of possible analyses. The diagram
        below shows how just three binary choices—outlier removal, covariate inclusion,
        and subgroup selection—create 2 × 2 × 2 = 8 possible analysis paths.
      </p>

      <div className="p-hacking-viz-container forking-paths-diagram">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Links from root to level 1 */}
          {treeData.level1.map((node, i) => (
            <line
              key={`link-0-${i}`}
              x1={treeData.root.x}
              y1={treeData.root.y + 15}
              x2={node.x}
              y2={node.y - 15}
              className="tree-link"
            />
          ))}

          {/* Links from level 1 to level 2 */}
          {treeData.level2.map((node, i) => (
            <line
              key={`link-1-${i}`}
              x1={treeData.level1[Math.floor(i / 2)].x}
              y1={treeData.level1[Math.floor(i / 2)].y + 15}
              x2={node.x}
              y2={node.y - 15}
              className="tree-link"
            />
          ))}

          {/* Links from level 2 to level 3 */}
          {treeData.level3.map((node, i) => (
            <line
              key={`link-2-${i}`}
              x1={treeData.level2[Math.floor(i / 2)].x}
              y1={treeData.level2[Math.floor(i / 2)].y + 15}
              x2={node.x}
              y2={node.y - 15}
              className="tree-link"
            />
          ))}

          {/* Root node */}
          <circle
            cx={treeData.root.x}
            cy={treeData.root.y}
            r={15}
            className="tree-node root"
          />
          <text
            x={treeData.root.x}
            y={treeData.root.y - 22}
            textAnchor="middle"
            className="tree-label"
            fontWeight={600}
          >
            {treeData.root.label}
          </text>

          {/* Level 1 nodes */}
          {treeData.level1.map((node, i) => (
            <g key={`level1-${i}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={12}
                className="tree-node"
              />
              <text
                x={node.x}
                y={node.y + 28}
                textAnchor="middle"
                className="tree-label"
                fontSize={10}
              >
                {node.label}
              </text>
            </g>
          ))}

          {/* Level 2 nodes */}
          {treeData.level2.map((node, i) => (
            <g key={`level2-${i}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={10}
                className="tree-node"
              />
              <text
                x={node.x}
                y={node.y + 24}
                textAnchor="middle"
                className="tree-label"
                fontSize={9}
              >
                {node.label}
              </text>
            </g>
          ))}

          {/* Level 3 (leaf) nodes - one marked as "significant" */}
          {treeData.level3.map((node, i) => {
            // Mark one as significant for illustration (index 5)
            const isSignificant = i === 5;
            return (
              <g key={`level3-${i}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={8}
                  className={`tree-node leaf ${isSignificant ? 'significant' : ''}`}
                />
                <text
                  x={node.x}
                  y={node.y + 20}
                  textAnchor="middle"
                  className="tree-label"
                  fontSize={8}
                >
                  {node.label}
                </text>
                {isSignificant && (
                  <text
                    x={node.x}
                    y={node.y + 32}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--accent)"
                    fontWeight={600}
                  >
                    p &lt; .05!
                  </text>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${width - 130}, ${height - 60})`}>
            <circle cx={0} cy={0} r={8} className="tree-node leaf significant" />
            <text x={15} y={4} fontSize={10} fill="var(--text-secondary)">
              "Significant" result
            </text>
            <circle cx={0} cy={22} r={8} className="tree-node leaf" />
            <text x={15} y={26} fontSize={10} fill="var(--text-secondary)">
              Non-significant
            </text>
          </g>

          {/* Annotation */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize={12}
            fill="var(--text-secondary)"
          >
            Just 3 binary choices → 8 possible analyses → 1 "significant" result
          </text>
        </svg>
      </div>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>The Multiplicity Problem</h4>
        <p>
          Each degree of freedom multiplies the opportunities for false positives.
          If you try enough combinations, something will be "significant" by chance.
        </p>
      </div>
    </div>
  );
}
