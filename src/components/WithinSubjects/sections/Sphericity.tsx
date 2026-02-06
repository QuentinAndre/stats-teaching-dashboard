export default function Sphericity() {
  return (
    <div className="section-intro">
      <h2>A Note on Sphericity</h2>

      <p className="intro-text">
        You may have heard of <em>sphericity</em> (sometimes called "circularity") as an
        assumption for repeated measures analyses. Here's what you need to know.
      </p>

      <h3>What Is Sphericity?</h3>

      <p className="intro-text">
        Sphericity is an assumption about the <strong>variances of difference scores</strong>.
        Specifically, it requires that the variance of the differences between all pairs of
        within-subjects conditions be equal. In our three-condition Stroop task:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>Var(Congruent − Neutral) should equal Var(Congruent − Incongruent)</li>
        <li>Var(Congruent − Neutral) should equal Var(Neutral − Incongruent)</li>
        <li>Var(Congruent − Incongruent) should equal Var(Neutral − Incongruent)</li>
      </ul>

      <h3>When Does It Matter?</h3>

      <div className="viz-container">
        <h4>Sphericity Applies When...</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
          <div>
            <h5 style={{ color: 'var(--color-within)', marginBottom: 'var(--spacing-sm)' }}>
              The within-subjects factor has 3+ levels
            </h5>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              With only 2 levels (like our paired Stroop comparison), there's only one difference
              score, so sphericity is automatically satisfied. With 3 conditions (Congruent,
              Neutral, Incongruent), sphericity becomes relevant.
            </p>
          </div>
          <div>
            <h5 style={{ color: 'var(--color-interaction)', marginBottom: 'var(--spacing-sm)' }}>
              Testing the main effect with MS<sub>A×S</sub>
            </h5>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Sphericity applies to the F-test for the treatment effect. If sphericity is
              violated, the F-test becomes liberal (too many false positives).
            </p>
          </div>
        </div>
      </div>

      <h3>What Happens When Sphericity Is Violated?</h3>

      <p className="intro-text">
        If the variances of difference scores are unequal, the F-ratio doesn't follow the
        expected F distribution. The result is an inflated Type I error rate—you're more
        likely to declare significance when there's no real effect.
      </p>

      <div className="key-insight">
        <h4>When You Have 3+ Within-Subjects Levels</h4>
        <p>
          Test sphericity using <strong>Mauchly's test</strong>. If violated, apply
          corrections to the degrees of freedom:
        </p>
        <ul style={{ margin: 'var(--spacing-md) 0 0 var(--spacing-lg)', lineHeight: 1.8 }}>
          <li><strong>Greenhouse-Geisser (ε<sub>GG</sub>):</strong> More conservative correction, recommended when ε &lt; 0.75</li>
          <li><strong>Huynh-Feldt (ε<sub>HF</sub>):</strong> Less conservative correction, recommended when ε ≥ 0.75</li>
        </ul>
        <p style={{ marginTop: 'var(--spacing-md)' }}>
          These corrections multiply the df values, making the F-test more conservative when
          sphericity is violated. Most statistical software (SPSS, R, etc.) reports these
          automatically.
        </p>
      </div>

      <h3>Practical Advice</h3>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong>With 2 within-subjects levels:</strong> Don't worry about sphericity—it's
          automatically satisfied (only one difference score possible).
        </li>
        <li>
          <strong>With 3+ within-subjects levels:</strong> Report both uncorrected and
          Greenhouse-Geisser corrected results. If they lead to the same conclusion, your
          findings are robust.
        </li>
        <li>
          <strong>Severe violations:</strong> Consider multivariate approaches (MANOVA),
          which don't assume sphericity but require larger samples.
        </li>
      </ul>

      <div className="key-insight">
        <h4>The Bottom Line</h4>
        <p>
          Sphericity is one of those statistical assumptions that sounds scarier than it is.
          For designs with only two within-subjects levels (the most common case), it's not
          an issue. For designs with more levels, modern software handles the corrections
          automatically. Focus on understanding your data and interpreting your effects—that's
          where the real insights lie.
        </p>
      </div>
    </div>
  );
}
