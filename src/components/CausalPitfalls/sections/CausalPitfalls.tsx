import { useState } from 'react';
import PathDiagram from '../../shared/PathDiagram';

export default function CausalPitfalls() {
  const [showConfounder, setShowConfounder] = useState(false);

  return (
    <div className="section-intro">
      <h2>Causal Pitfalls of Mediation</h2>

      <p className="intro-text">
        The bootstrap test from the previous module answers a narrow statistical
        question: is the product <em>ab</em> distinguishable from zero given
        sampling variability? But a significant bootstrap CI does not mean
        mediation actually occurred. The causal interpretation depends on
        assumptions that are rarely stated and often violated.
      </p>

      <div className="viz-container">
        <h4>Path Diagram With and Without an Unmeasured Confounder</h4>

        <div className="toggle-group">
          <button
            className={`toggle-button${!showConfounder ? ' active' : ''}`}
            onClick={() => setShowConfounder(false)}
          >
            Standard Model
          </button>
          <button
            className={`toggle-button${showConfounder ? ' active' : ''}`}
            onClick={() => setShowConfounder(true)}
          >
            With Confounder
          </button>
        </div>

        <div className="path-diagram-container">
          {showConfounder ? (
            <PathDiagram
              aLabel="a"
              bLabel="b"
              cPrimeLabel="c'"
              showConfounder={true}
              confounderLabel="U (unmeasured)"
              confounderToMLabel="?"
              confounderToYLabel="?"
            />
          ) : (
            <PathDiagram
              aLabel="a"
              bLabel="b"
              cPrimeLabel="c'"
            />
          )}
        </div>
      </div>

      <div className="pitfall-item">
        <h4>Pitfall 1: Every arrow is a causal claim (Rohrer et al., 2022)</h4>
        <p>
          Each single-headed arrow in the path diagram asserts a causal
          effect — not merely a correlation. Drawing X &rarr; M &rarr; Y claims
          that X causes M and M causes Y. The data alone cannot verify these
          directional claims.
        </p>
      </div>

      <div className="pitfall-item">
        <h4>Pitfall 2: Double trouble (Rohrer et al., 2022)</h4>
        <p>
          Mediation requires identifying TWO unconfounded causal effects
          simultaneously. If either the X &rarr; M path or the M &rarr; Y path
          is confounded by an omitted variable, the indirect effect estimate is
          biased. Even with a randomized X, the M &rarr; Y path remains
          observational.
        </p>
      </div>

      <div className="pitfall-item">
        <h4>Pitfall 3: Randomizing X does not fix the M &rarr; Y path</h4>
        <p>
          When X is randomly assigned, the <em>a</em>-path (X &rarr; M) is
          protected from confounding. But the mediator M is not randomly
          assigned — it is an observed outcome. The <em>b</em>-path
          (M &rarr; Y, controlling for X) remains vulnerable to any variable
          that affects both M and Y. Controlling for M when estimating this path
          can also introduce collider bias.
        </p>
      </div>

      <div className="pitfall-item">
        <h4>
          Pitfall 4: Equivalent models are statistically indistinguishable
          (Rohrer et al., 2022; Pieters, 2017)
        </h4>
        <p>
          With three variables and a saturated model (zero degrees of freedom),
          multiple causal orderings produce identical model fit. The data cannot
          distinguish X &rarr; M &rarr; Y from X &rarr; Y &rarr; M or other
          configurations. Choosing the "right" model requires theory, temporal
          precedence, or direct experimental manipulation of M.
        </p>
      </div>

      <div className="pitfall-item">
        <h4>
          Pitfall 5: Six conditions for meaningful mediation (Pieters, 2017)
        </h4>
        <p>
          Pieters identifies six conditions the mediator-outcome relationship
          must satisfy: (1) <em>directionality</em> — the most plausible causal
          direction must be M &rarr; Y; (2) <em>reliability</em> — measurement
          error in M and Y must be ignorable; (3) <em>unconfoundedness</em> —
          omitted variables must have negligible effects;
          (4) <em>distinctiveness</em> — M and Y must be conceptually and
          empirically distinguishable; (5) <em>power</em> — statistical power
          must be sufficient; and (6) <em>mediation</em> — the indirect effect
          must be non-null. Most published mediation analyses address only
          condition 6.
        </p>
      </div>

      <div className="warning-insight">
        <h4>Statistical significance &ne; Causal mediation</h4>
        <p>
          A significant bootstrap confidence interval tells you that the
          product <em>ab</em> is unlikely to be zero given sampling noise. It
          does not tell you that X actually caused M, that M actually caused Y,
          or that the indirect path is the mechanism through which X affects Y.
          The next two sections demonstrate these problems concretely.
        </p>
      </div>
    </div>
  );
}
