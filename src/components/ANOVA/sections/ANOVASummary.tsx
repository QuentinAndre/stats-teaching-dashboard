import { useMemo } from 'react';

export default function ANOVASummary() {
  // Generate conceptual data for the flow diagram
  const flowSteps = useMemo(() => [
    {
      step: 1,
      title: 'Calculate Total Variability',
      description: 'How much do all observations vary from the grand mean?',
      formula: 'SS_Total = Σ(X_ij - X̄..)²',
      color: '#6c757d',
    },
    {
      step: 2,
      title: 'Partition into Sources',
      description: 'Split variance into between-groups and within-groups components.',
      formula: 'SS_Total = SS_Between + SS_Within',
      color: '#4361ee',
    },
    {
      step: 3,
      title: 'Compute Mean Squares',
      description: 'Adjust for degrees of freedom to get variance estimates.',
      formula: 'MS = SS / df',
      color: '#f4a261',
    },
    {
      step: 4,
      title: 'Form the F-Ratio',
      description: 'Compare signal (between) to noise (within).',
      formula: 'F = MS_Between / MS_Within',
      color: '#e63946',
    },
  ], []);

  // SVG dimensions for vertical flow diagram
  const width = 600;
  const height = 580;
  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const boxWidth = 320;
  const boxHeight = 65;
  const verticalGap = 70;

  return (
    <div className="section-intro">
      <h2>The Logic of ANOVA</h2>

      <p className="intro-text">
        We've now built a complete understanding of <strong>Analysis of Variance</strong>.
        Let's step back and see the elegant logic that ties it all together.
      </p>

      <div className="key-insight" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h4>The Central Question</h4>
        <p>
          ANOVA doesn't ask "Are the means different?" directly. Instead, it asks a deeper question:
          <strong> "Where does the variability in our data come from?"</strong> By partitioning
          total variance into meaningful sources, we can determine whether group membership
          explains a meaningful portion of the variation we observe.
        </p>
      </div>

      <h3>The Four-Step Framework</h3>

      <p className="intro-text">
        Every ANOVA follows the same fundamental logic, whether comparing 2 groups or 20:
      </p>

      <div className="viz-container" style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead-summary"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#adb5bd" />
            </marker>
          </defs>

          {/* Flow diagram showing the 4 steps - vertical layout */}
          {flowSteps.map((step, i) => {
            const x = (width - boxWidth) / 2;
            const y = margin.top + i * (boxHeight + verticalGap);

            return (
              <g key={step.step}>
                {/* Step box with explicit light fill */}
                <rect
                  x={x}
                  y={y}
                  width={boxWidth}
                  height={boxHeight}
                  fill="#f8f9fa"
                  stroke={step.color}
                  strokeWidth={3}
                  rx={8}
                />

                {/* Step number badge on left */}
                <circle
                  cx={x - 25}
                  cy={y + boxHeight / 2}
                  r={20}
                  fill={step.color}
                />
                <text
                  x={x - 25}
                  y={y + boxHeight / 2 + 6}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={700}
                  fill="white"
                >
                  {step.step}
                </text>

                {/* Step title inside box */}
                <text
                  x={x + boxWidth / 2}
                  y={y + 26}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={600}
                  fill="#212529"
                >
                  {step.title}
                </text>

                {/* Formula inside box */}
                <text
                  x={x + boxWidth / 2}
                  y={y + 48}
                  textAnchor="middle"
                  fontSize={12}
                  fill={step.color}
                  fontFamily="monospace"
                  fontWeight={500}
                >
                  {step.formula}
                </text>

                {/* Description below box */}
                <text
                  x={x + boxWidth / 2}
                  y={y + boxHeight + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#6c757d"
                >
                  {step.description}
                </text>

                {/* Connecting arrow to next step */}
                {i < flowSteps.length - 1 && (
                  <path
                    d={`M ${x + boxWidth / 2} ${y + boxHeight + 28}
                        L ${x + boxWidth / 2} ${y + boxHeight + verticalGap - 8}`}
                    fill="none"
                    stroke="#adb5bd"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead-summary)"
                  />
                )}
              </g>
            );
          })}

          {/* Final decision box */}
          <rect
            x={(width - 220) / 2}
            y={height - 65}
            width={220}
            height={50}
            fill="#e63946"
            opacity={0.12}
            rx={8}
            stroke="#e63946"
            strokeWidth={1}
          />
          <text
            x={width / 2}
            y={height - 42}
            textAnchor="middle"
            fontSize={13}
            fontWeight={600}
            fill="#e63946"
          >
            If F is large → Reject H₀
          </text>
          <text
            x={width / 2}
            y={height - 24}
            textAnchor="middle"
            fontSize={11}
            fill="#6c757d"
          >
            At least one group mean differs
          </text>
        </svg>
      </div>

      <h3>Connections to Previous Modules</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-lg)'
      }}>
        {/* Connection to Sampling Distributions */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ marginTop: 0, color: 'var(--primary)' }}>
            Sampling Distributions
          </h4>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
            Just as sample means follow a <strong>t-distribution</strong> under the null hypothesis,
            the ratio of variance estimates follows an <strong>F-distribution</strong>. The F-distribution
            tells us what to expect when there are no real group differences—purely sampling variability.
          </p>
        </div>

        {/* Connection to NHST */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ marginTop: 0, color: 'var(--accent)' }}>
            Hypothesis Testing
          </h4>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
            ANOVA uses the same NHST logic: assume the null is true (all groups have equal means),
            calculate what we'd expect under that assumption, and see if our data are surprising enough
            to reject it. The F-statistic is our test statistic; the p-value tells us how rare our result would be.
          </p>
        </div>

        {/* Connection to t-test */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ marginTop: 0, color: '#2a9d8f' }}>
            The t-Test
          </h4>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
            For two groups, ANOVA and the t-test are <strong>mathematically equivalent</strong>: F = t².
            ANOVA generalizes the t-test logic to any number of groups while controlling the familywise
            error rate with a single omnibus test.
          </p>
        </div>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>The Bigger Picture: Variance as Information</h3>

      <p className="intro-text">
        The variance partitioning approach reveals something profound about statistical analysis.
        Variability isn't just noise to be eliminated—it's <em>information</em> about our data's structure.
      </p>

      <div className="formula-box">
        <h3>The Fundamental Equation</h3>
        <div className="formula">
          <span className="formula-main">
            SS<sub>Total</sub> = SS<sub>Between</sub> + SS<sub>Within</sub>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">SS<sub>Total</sub></span>
            <span className="explanation">
              Total variability: everything that varies in our data
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Between</sub></span>
            <span className="explanation">
              Systematic variability: what our groups explain
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Within</sub></span>
            <span className="explanation">
              Error variability: individual differences + noise
            </span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        This decomposition always holds. Every observation's deviation from the grand mean can be
        split into a part explained by group membership and a part that remains unexplained.
        The F-test asks whether the explained part is large enough to be meaningful.
      </p>

      <h3>Looking Ahead: Factorial Designs</h3>

      <p className="intro-text">
        The variance partitioning logic extends naturally to more complex designs. When you have
        <em> multiple factors</em> (e.g., both treatment type AND dosage level), you can partition
        variance into even more meaningful sources:
      </p>

      <div style={{
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border)',
        marginTop: 'var(--spacing-md)'
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '0.9375rem',
          lineHeight: 1.8,
          color: 'var(--text-primary)'
        }}>
          <div>SS<sub>Total</sub> = SS<sub>Factor A</sub> + SS<sub>Factor B</sub> + SS<sub>A×B</sub> + SS<sub>Within</sub></div>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
          In a two-way ANOVA, we can separate the main effects of each factor from their <strong>interaction</strong>—
          whether the effect of one factor depends on the level of the other.
        </p>
      </div>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>Key Takeaways</h4>
        <ul style={{ marginBottom: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.8 }}>
          <li>
            <strong>ANOVA partitions variance</strong> into sources: between-groups (signal) and within-groups (noise).
          </li>
          <li>
            <strong>The F-ratio</strong> compares these sources: large F means the signal exceeds the noise.
          </li>
          <li>
            <strong>A single omnibus test</strong> controls familywise error when comparing multiple groups.
          </li>
          <li>
            <strong>The logic generalizes</strong> to any number of groups and extends to factorial designs.
          </li>
          <li>
            For two groups, <strong>F = t²</strong>—ANOVA and t-tests are fundamentally the same.
          </li>
        </ul>
      </div>

      <footer className="narrative-footer" style={{ marginTop: 'var(--spacing-2xl)' }}>
        <p>
          Inspired by the variance partitioning approach in{' '}
          <a
            href="https://www.amazon.com/Design-Analysis-Researchers-Handbook-4th/dp/0135159415"
            target="_blank"
            rel="noopener noreferrer"
          >
            Keppel & Wickens: Design and Analysis
          </a>
        </p>
      </footer>
    </div>
  );
}
