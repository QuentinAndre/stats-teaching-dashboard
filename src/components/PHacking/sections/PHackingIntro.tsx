export default function PHackingIntro() {
  return (
    <div className="section-intro">
      <h2>When Methods Go Wrong</h2>

      <p className="intro-text">
        In 2011, a respected psychologist named Daryl Bem published a paper in one of
        psychology's most prestigious journals. The paper presented evidence that people
        could perceive the future—essentially proving the existence of precognition (ESP).
        The paper passed peer review, used standard statistical methods, and reported
        significant effects across nine experiments.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        The reaction in the scientific community was not excitement about ESP. Instead,
        it was alarm about the methods that had allowed such a paper to be published.
        If standard psychological research practices could produce "evidence" for
        something as implausible as seeing the future, then those same methods could
        produce false evidence for <em>any</em> claim.
      </p>

      <div className="key-insight warning-box" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>The Problem</h4>
        <p>
          If standard methods can "prove" people can see the future, something is
          deeply wrong with the methods themselves. The issue isn't fraud—it's that
          flexibility in data analysis, combined with pressure to find "significant"
          results, can generate "evidence" for anything.
        </p>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>False-Positive Psychology</h3>

      <p style={{ lineHeight: 1.7 }}>
        In response to Bem's paper, Simmons, Nelson, and Simonsohn (2011) published a
        landmark paper titled <em>"False-Positive Psychology."</em> They demonstrated
        that common research practices—all individually defensible—could combine to
        push the false-positive rate far above the nominal 5% (α = 0.05).
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        They called these practices <strong>researcher degrees of freedom</strong>:
        the many small decisions a researcher makes during data collection and analysis.
        Each decision seems reasonable in isolation, but the cumulative effect is
        devastating for the integrity of statistical inference.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        To demonstrate this, they famously "proved" that listening to a specific song
        could make people younger—an obviously false claim achieved through completely
        standard (but undisclosed) analytic flexibility.
      </p>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>Key Insight</h4>
        <p>
          This phenomenon—exploiting analytic flexibility to obtain significant
          results—is now commonly called <strong>p-hacking</strong>. The term
          captures how researchers can "hack" their way to a low p-value through
          seemingly innocent decisions about how to analyze their data.
        </p>
      </div>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>What You'll Learn</h3>

      <p style={{ lineHeight: 1.7 }}>
        In this module, you will:
      </p>

      <ol style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.8 }}>
        <li>
          <strong>Understand researcher degrees of freedom</strong>—the specific
          analytic choices that can inflate false-positive rates
        </li>
        <li>
          <strong>See p-hacking in action</strong>—watch how combining these choices
          can produce "significance" from pure noise
        </li>
        <li>
          <strong>Experience it yourself</strong>—use our simulator to see just how
          easy it is to find a p &lt; .05 when no real effect exists
        </li>
      </ol>
    </div>
  );
}
