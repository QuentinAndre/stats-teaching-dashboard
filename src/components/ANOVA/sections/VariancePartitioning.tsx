import ANOVADecompositionTable from '../ANOVADecompositionTable';

export default function VariancePartitioning() {
  return (
    <div className="section-intro">
      <h2>Where Does the Variability Come From?</h2>

      <p className="intro-text">
        This is the heart of ANOVA: <strong>partitioning variance</strong>. Every observation
        in our dataset deviates from the overall average (the grand mean). ANOVA asks:
        how much of this deviation is due to <em>group membership</em> versus <em>individual differences within groups</em>?
      </p>

      <div className="formula-box">
        <h3>The Fundamental Partition</h3>
        <div className="formula">
          <span className="formula-main">SS<sub>Total</sub> = SS<sub>Between</sub> + SS<sub>Within</sub></span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">SS<sub>Total</sub></span>
            <span className="explanation">
              Total variability: sum of squared deviations of all observations from the grand mean
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Between</sub></span>
            <span className="explanation">
              Between-group variability: how much group means differ from the grand mean
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Within</sub></span>
            <span className="explanation">
              Within-group variability: how much individuals vary within their own groups
            </span>
          </div>
        </div>
      </div>

      <h3>The Three Steps of Decomposition</h3>

      <p className="intro-text">
        Watch how ANOVA breaks down total variance into its components:
      </p>

      {/* Sequential Three-Step Demonstration */}
      {(() => {
        // Consistent data points across all three steps
        const group1Y = [30, 40, 50, 55]; // Group 1 points (above grand mean)
        const group2Y = [65, 75, 80, 90]; // Group 2 points (below grand mean)
        const grandMeanY = 60;
        const group1MeanY = 44; // Mean of group 1
        const group2MeanY = 77; // Mean of group 2
        const group1X = [50, 70, 90, 110]; // x positions for group 1
        const group2X = [190, 210, 230, 250]; // x positions for group 2
        const offset = 2;

        return (
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            {/* Step 1: Total Variance */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '1rem', color: '#6c757d' }}>
                Step 1: Total Variance
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="350" height="140" viewBox="0 0 350 140">
                  <line x1="30" y1={grandMeanY} x2="280" y2={grandMeanY} stroke="#6c757d" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="290" y={grandMeanY + 4} fontSize="11" fill="#6c757d">Grand Mean</text>
                  {/* Group 1 points with deviation lines - all gray */}
                  {group1Y.map((y, i) => (
                    <g key={i}>
                      <line x1={group1X[i]} y1={y} x2={group1X[i]} y2={grandMeanY} stroke="#6c757d" strokeWidth="1.5" opacity="0.5" />
                      <circle cx={group1X[i]} cy={y} r="6" fill="#6c757d" />
                    </g>
                  ))}
                  {/* Group 2 points with deviation lines - all gray */}
                  {group2Y.map((y, i) => (
                    <g key={i + 4}>
                      <line x1={group2X[i]} y1={y} x2={group2X[i]} y2={grandMeanY} stroke="#6c757d" strokeWidth="1.5" opacity="0.5" />
                      <circle cx={group2X[i]} cy={y} r="6" fill="#6c757d" />
                    </g>
                  ))}
                </svg>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', marginTop: 'var(--spacing-md)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  All observations are shown as gray dots. Each vertical line shows how far that
                  observation deviates from the <strong>grand mean</strong> (the average of all data points).
                  The sum of these squared deviations is <strong>SS<sub>Total</sub></strong>.
                </p>
              </div>
            </div>

            {/* Step 2: Reveal Groups */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '1rem', color: 'var(--primary)' }}>
                Step 2: Reveal Groups
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="350" height="140" viewBox="0 0 350 140">
                  <line x1="30" y1={grandMeanY} x2="280" y2={grandMeanY} stroke="#6c757d" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
                  {/* Group means */}
                  <line x1="35" y1={group1MeanY} x2="125" y2={group1MeanY} stroke="#4361ee" strokeWidth="3" />
                  <line x1="175" y1={group2MeanY} x2="265" y2={group2MeanY} stroke="#f4a261" strokeWidth="3" />
                  {/* Group labels */}
                  <text x="80" y="125" textAnchor="middle" fontSize="11" fill="#4361ee" fontWeight="600">Group 1</text>
                  <text x="220" y="125" textAnchor="middle" fontSize="11" fill="#f4a261" fontWeight="600">Group 2</text>
                  {/* Group 1 points - colored, no deviation lines */}
                  {group1Y.map((y, i) => (
                    <g key={i}>
                      <circle cx={group1X[i]} cy={y} r="6" fill="#4361ee" />
                    </g>
                  ))}
                  {/* Group 2 points - colored, no deviation lines */}
                  {group2Y.map((y, i) => (
                    <g key={i + 4}>
                      <circle cx={group2X[i]} cy={y} r="6" fill="#f4a261" />
                    </g>
                  ))}
                </svg>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', marginTop: 'var(--spacing-md)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Now we color the points by group and show each <strong>group mean</strong>.
                  Notice that the group means differ from the grand mean—this is the "between-group"
                  variation we want to detect.
                </p>
              </div>
            </div>

            {/* Step 3: Decompose */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border)'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '1rem', color: '#e63946' }}>
                Step 3: Decompose
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="350" height="140" viewBox="0 0 350 140">
                  <line x1="30" y1={grandMeanY} x2="280" y2={grandMeanY} stroke="#6c757d" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
                  {/* Group means */}
                  <line x1="35" y1={group1MeanY} x2="125" y2={group1MeanY} stroke="#4361ee" strokeWidth="3" />
                  <line x1="175" y1={group2MeanY} x2="265" y2={group2MeanY} stroke="#f4a261" strokeWidth="3" />
                  {/* Group labels */}
                  <text x="80" y="125" textAnchor="middle" fontSize="11" fill="#4361ee" fontWeight="600">Group 1</text>
                  <text x="220" y="125" textAnchor="middle" fontSize="11" fill="#f4a261" fontWeight="600">Group 2</text>
                  {/* Group 1 decomposition - with offset for visibility */}
                  {group1Y.map((y, i) => {
                    const x = group1X[i];
                    return (
                      <g key={i}>
                        {/* Between: group mean to grand mean */}
                        <line x1={x - offset} y1={group1MeanY} x2={x - offset} y2={grandMeanY} stroke="#8b5cf6" strokeWidth="3" opacity="0.8" />
                        {/* Within: point to group mean */}
                        <line x1={x + offset} y1={y} x2={x + offset} y2={group1MeanY} stroke="#10b981" strokeWidth="3" opacity="0.8" />
                        <circle cx={x} cy={y} r="6" fill="#4361ee" />
                      </g>
                    );
                  })}
                  {/* Group 2 decomposition - with offset for visibility */}
                  {group2Y.map((y, i) => {
                    const x = group2X[i];
                    return (
                      <g key={i + 4}>
                        {/* Between: group mean to grand mean */}
                        <line x1={x - offset} y1={group2MeanY} x2={x - offset} y2={grandMeanY} stroke="#8b5cf6" strokeWidth="3" opacity="0.8" />
                        {/* Within: point to group mean */}
                        <line x1={x + offset} y1={y} x2={x + offset} y2={group2MeanY} stroke="#10b981" strokeWidth="3" opacity="0.8" />
                        <circle cx={x} cy={y} r="6" fill="#f4a261" />
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <div style={{ width: '20px', height: '4px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Between-groups (SS<sub>B</sub>)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <div style={{ width: '20px', height: '4px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Within-groups (SS<sub>W</sub>)</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  The Total Variance in the sample is now split into two parts:
                </p>
                <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0, fontSize: '0.875rem' }}>
                  <li><strong style={{ color: '#8b5cf6' }}>Purple (Between)</strong>: Distance from group mean to grand mean, reflecting the amount of variance explained by the group membership.</li>
                  <li><strong style={{ color: '#10b981' }}>Green (Within)</strong>: Distance from observation to group mean, reflecting the amount of individual variation within each group.</li>
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      <h3>See How It's Calculated</h3>

      <p className="intro-text">
        Step through the calculation to see exactly how ANOVA partitions total variance
        into between-group and within-group components:
      </p>

      <ANOVADecompositionTable />
    </div>
  );
}
