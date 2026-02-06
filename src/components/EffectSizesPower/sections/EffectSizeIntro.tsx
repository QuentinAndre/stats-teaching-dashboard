export default function EffectSizeIntro() {
  return (
    <div className="section-intro">
      <h2>What Are Effect Sizes?</h2>

      <p className="intro-text">
        Statistical significance tells us whether an effect is <em>real</em> (unlikely to be due to chance),
        but it doesn't tell us whether the effect is <em>meaningful</em>. A study with thousands of
        participants can detect trivially small effects that have no practical importance. Effect sizes
        quantify the <strong>magnitude</strong> of an effect, answering the question: "How big is it?"
      </p>

      <div className="key-insight">
        <h4>The Problem with p-Values Alone</h4>
        <p>
          A p-value depends on both the true effect size <em>and</em> the sample size. With enough
          participants, any non-zero effect becomes statistically significant. Effect sizes separate
          these two pieces of information, allowing us to evaluate practical importance independently
          of sample size.
        </p>
      </div>

      <h3>Unstandardized vs. Standardized Effect Sizes</h3>

      <p className="intro-text">
        Effect sizes come in two flavors, each useful in different contexts:
      </p>

      <div className="formula-box">
        <h3>Unstandardized Effect Sizes</h3>
        <p className="intro-text">
          When the outcome measure has <strong>meaningful units</strong>, reporting the raw difference
          is often most interpretable:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <li><strong>Blood pressure:</strong> "The treatment reduced systolic BP by 8 mmHg"</li>
          <li><strong>Reaction time:</strong> "Participants responded 45 ms faster"</li>
          <li><strong>Income:</strong> "The program increased annual earnings by $2,400"</li>
          <li><strong>Survival:</strong> "Median survival increased by 3.2 months"</li>
        </ul>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)' }}>
          These raw units are immediately meaningful to clinicians, policymakers, and practitioners
          who work with these measures daily.
        </p>
      </div>

      <div className="formula-box">
        <h3>Standardized Effect Sizes</h3>
        <p className="intro-text">
          When the outcome measure has <strong>arbitrary units</strong> or when comparing across
          studies using different measures, we need standardized effect sizes:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <li><strong>Psychological scales:</strong> What does "5 points higher on the anxiety inventory" mean?</li>
          <li><strong>Meta-analysis:</strong> Combining studies that used different depression measures</li>
          <li><strong>Cross-domain comparison:</strong> Is an intervention's effect on reading similar to its effect on math?</li>
        </ul>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)' }}>
          Standardized effect sizes express differences in <strong>standard deviation units</strong>,
          providing a common metric regardless of the original scale.
        </p>
      </div>

      <h3>Types of Standardized Effect Sizes</h3>

      <p className="intro-text">
        Different research designs call for different effect size measures. In this module, we'll cover:
      </p>

      <table className="effect-size-table">
        <thead>
          <tr>
            <th>Effect Size</th>
            <th>Design</th>
            <th>Interpretation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span className="math">d</span> (Cohen's d)</td>
            <td>Two-group comparisons</td>
            <td>Difference in SD units</td>
          </tr>
          <tr>
            <td><span className="math">η²</span> (eta-squared)</td>
            <td>ANOVA</td>
            <td>Proportion of variance explained</td>
          </tr>
          <tr>
            <td><span className="math">ω²</span> (omega-squared)</td>
            <td>ANOVA</td>
            <td>Less biased variance estimate</td>
          </tr>
        </tbody>
      </table>

      <div className="key-insight">
        <h4>Why Effect Sizes Matter</h4>
        <p>
          Effect sizes are essential for: (1) evaluating practical significance, (2) planning future
          studies through power analysis, (3) comparing results across studies, and (4) conducting
          meta-analyses. Many journals now require effect sizes to be reported alongside p-values.
        </p>
      </div>
    </div>
  );
}
