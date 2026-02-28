import PathDiagram from '../../shared/PathDiagram';

export default function MediationIntro() {
  return (
    <div className="section-intro">
      <h2>What Is Mediation?</h2>

      <p className="intro-text">
        Most experiments in psychology ask whether an independent variable X affects
        an outcome Y. Mediation analysis asks a different question: <em>why</em> or{' '}
        <em>how</em> does X affect Y? Instead of stopping at the total effect, we
        propose a mechanism — a <strong>mediator</strong> variable M that sits on the
        causal pathway between X and Y. The claim is that X changes M, and M in turn
        changes Y. Part (or all) of the total effect of X on Y is transmitted through
        this intermediate variable.
      </p>

      <h3>The Running Example</h3>

      <p className="intro-text">
        Suppose a researcher conducts a hypothetical field experiment in a large
        organization. Managers are randomly assigned to receive either a standard
        management training program (X = 0) or an <strong>autonomy-supportive
        leadership</strong> training (X = 1). Six months later, two outcomes are
        measured for each manager's direct reports:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong>M</strong> — <em>Psychological empowerment</em> (1–7 Likert
          scale), the proposed mediator
        </li>
        <li>
          <strong>Y</strong> — <em>Job satisfaction</em> (1–7 Likert scale), the
          primary outcome
        </li>
      </ul>

      <p className="intro-text">
        The theoretical argument is straightforward: autonomy-supportive leadership
        increases employees' sense of psychological empowerment, and that increased
        empowerment in turn raises their job satisfaction. The path diagram below
        shows this simple mediation model.
      </p>

      <div className="viz-container">
        <h4>Simple Mediation Model (PROCESS Model 4)</h4>
        <div className="path-diagram-container">
          <PathDiagram
            xLabel="X"
            mLabel="M"
            yLabel="Y"
            xDesc="Leadership Style"
            mDesc="Empowerment"
            yDesc="Job Satisfaction"
            aLabel="a"
            bLabel="b"
            cPrimeLabel="c'"
          />
        </div>
      </div>

      <p className="intro-text">
        The diagram contains three paths. The <em>a</em> path captures the effect of
        X on M — in our example, how much autonomy-supportive leadership raises
        empowerment relative to standard training. The <em>b</em> path captures the
        effect of M on Y, controlling for X — how much empowerment predicts job
        satisfaction, holding leadership condition constant. The <em>c'</em> path is
        the <strong>direct effect</strong> of X on Y after accounting for M — whatever
        influence leadership style has on job satisfaction that does not go through
        empowerment.
      </p>

      <h3>The Effect Decomposition</h3>

      <p className="intro-text">
        The total effect of X on Y (denoted <em>c</em>) can be decomposed into two
        components: the <strong>direct effect</strong> (<em>c'</em>) and
        the <strong>indirect effect</strong> (<em>a</em> &times; <em>b</em>). The
        indirect effect represents the portion of the total effect that is
        transmitted through M. In OLS regression with a single mediator, this
        decomposition is exact:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            <em>c</em> = <em>c'</em> + <em>a</em> &times; <em>b</em>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol"><em>c</em></span>
            <span className="explanation">Total effect of X on Y</span>
          </div>
          <div className="formula-part">
            <span className="symbol"><em>c'</em></span>
            <span className="explanation">Direct effect (X &rarr; Y, controlling for M)</span>
          </div>
          <div className="formula-part">
            <span className="symbol"><em>a</em> &times; <em>b</em></span>
            <span className="explanation">Indirect effect (X &rarr; M &rarr; Y)</span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        This decomposition is the core of simple mediation. If the indirect
        effect <em>ab</em> is meaningfully different from zero, we have evidence
        that M transmits part of the influence of X onto Y. If <em>c'</em> drops to
        near zero while <em>ab</em> accounts for most of the total effect, the
        mediation is often described as "full" (though this terminology is
        controversial — we will return to it later).
      </p>

      <h3>Three Regression Equations</h3>

      <p className="intro-text">
        PROCESS Model 4 (Hayes, 2018) formalizes simple mediation through three
        ordinary least-squares regression equations:
      </p>

      <div className="formula-box">
        <div className="formula" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <span className="formula-main">
            Eq 1: &nbsp; Y = <em>i</em><sub>1</sub> + <em>c</em> &middot; X
          </span>
        </div>
        <div className="formula" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <span className="formula-main">
            Eq 2: &nbsp; M = <em>i</em><sub>2</sub> + <em>a</em> &middot; X
          </span>
        </div>
        <div className="formula" style={{ marginBottom: 0 }}>
          <span className="formula-main">
            Eq 3: &nbsp; Y = <em>i</em><sub>3</sub> + <em>c'</em> &middot; X + <em>b</em> &middot; M
          </span>
        </div>
      </div>

      <p className="intro-text">
        Equation 1 gives the total effect of X on Y. Equation 2 estimates the{' '}
        <em>a</em> path. Equation 3 estimates both <em>c'</em> and <em>b</em>{' '}
        simultaneously. Together, these three regressions supply all the
        coefficients needed to compute the indirect effect and to test whether M
        mediates the relationship between X and Y.
      </p>

      <div className="key-insight">
        <h4>What This Module Covers</h4>
        <p>
          In the sections that follow, we build up the statistical machinery
          for mediation analysis. We begin with the three regressions and the
          algebraic decomposition, then move to inference — why the Sobel test
          falls short, and how bootstrapping the indirect effect provides a
          better alternative. The causal assumptions that mediation claims
          require are covered in the next module, <em>Causal Pitfalls of
          Mediation</em>.
        </p>
      </div>
    </div>
  );
}
