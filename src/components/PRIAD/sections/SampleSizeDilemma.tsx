import { requiredSampleSize, calculatePower } from '../../../utils/statistics';

export default function SampleSizeDilemma() {
  // Calculate example values
  const nForSmallEffect = requiredSampleSize(0.3, 0.80, 0.05, 2);
  const nForMediumEffect = requiredSampleSize(0.6, 0.80, 0.05, 2);
  const totalSmall = nForSmallEffect * 2;
  const totalMedium = nForMediumEffect * 2;
  const wastedParticipants = totalSmall - totalMedium;

  // Power if you plan for d=0.6 but true d=0.3
  const actualPower = calculatePower(0.3, nForMediumEffect, 0.05, 2) * 100;

  return (
    <div className="section-intro">
      <h2>The Sample Size Dilemma</h2>

      <p className="intro-text">
        Every researcher faces a fundamental challenge before running a study: <em>How many
        participants do I need?</em> The answer depends on the effect size you expect to
        find—but effect sizes are often unknown before the study begins.
      </p>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>The Cost of Guessing Wrong</h3>

      <p style={{ lineHeight: 1.7 }}>
        Imagine you anticipate a small-to-medium effect of <em>d</em> = 0.3. To achieve 80% power
        to detect this effect, you collect <strong>{totalSmall} participants</strong> ({nForSmallEffect} per
        group). Unbeknownst to you, the true effect is actually <em>d</em> = 0.6—a medium effect.
        You only needed <strong>{totalMedium} participants</strong> to achieve your desired level of
        power, and could have spent the money used collecting the extra {wastedParticipants} participants
        on another project.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        Now imagine the opposite scenario: You anticipate <em>d</em> = 0.6, so you
        collect {totalMedium} participants. Unbeknownst to you, the true effect is <em>d</em> = 0.3.
        You thought you had 80% power to detect the effect, but in truth you only
        had <strong>{actualPower.toFixed(0)}% power</strong>. This makes your study much less
        informative than you think!
      </p>

      <div className="key-insight warning-box" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>The Core Problem</h4>
        <p>
          If you guess wrong about effect size, you face one of two costly outcomes:
        </p>
        <ul style={{ marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
          <li>
            <strong>Underestimate the effect →</strong> You collect more data than necessary,
            wasting time and money
          </li>
          <li>
            <strong>Overestimate the effect →</strong> Your study is underpowered, and you
            risk a Type II error (missing a real effect)
          </li>
        </ul>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>The Intuitive (but Wrong) Solution</h3>

      <p style={{ lineHeight: 1.7 }}>
        A natural response to this uncertainty is to collect data in batches and <em>peek</em> at
        the results as you go. If the effect is large, you might reach significance early and
        stop collecting. If not, you continue until you have enough data.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        This seems perfectly reasonable—why waste resources collecting data you don't need?
        Unfortunately, this approach has a fatal flaw that invalidates your statistical inference.
      </p>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>What You'll Learn</h4>
        <p>
          In this module, you'll discover why naive "peeking" inflates false-positive rates,
          and how <strong>Pre-Registered Interim Analysis Designs (PRIADs)</strong> solve this
          problem—allowing you to collect data efficiently while maintaining α = 0.05.
        </p>
      </div>
    </div>
  );
}
