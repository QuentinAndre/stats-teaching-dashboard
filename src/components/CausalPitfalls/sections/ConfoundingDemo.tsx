import { useState, useMemo } from 'react';
import {
  generateConfoundedMediationData,
  fitSimpleRegression,
  fitMultipleRegression2,
  bootstrapIndirectEffectBatch,
  percentileCI,
} from '../../../utils/statistics';
import PathDiagram from '../../shared/PathDiagram';

export default function ConfoundingDemo() {
  const [trueA, setTrueA] = useState(0.50);
  const [trueB, setTrueB] = useState(0.00);
  const [trueCPrime, setTrueCPrime] = useState(0.60);
  const [uToM, setUToM] = useState(0.50);
  const [uToY, setUToY] = useState(0.40);

  // Generate confounded data (deterministic via seed)
  const data = useMemo(
    () =>
      generateConfoundedMediationData(42, 200, {
        a: trueA,
        bTrue: trueB,
        cPrime: trueCPrime,
        uToM,
        uToY,
        interceptM: 3.80,
        interceptY: 1.41,
      }),
    [trueA, trueB, trueCPrime, uToM, uToY]
  );

  // Fit standard mediation regressions on observed data (without U)
  const aReg = useMemo(
    () => fitSimpleRegression(data.m, data.x),
    [data]
  );
  const medReg = useMemo(
    () => fitMultipleRegression2(data.y, data.x, data.m),
    [data]
  );

  // Estimated coefficients the researcher would see
  const aHat = aReg.slope;
  const bHat = medReg.b2;
  const cPrimeHat = medReg.b1;
  const estimatedIndirect = aHat * bHat;
  const trueIndirect = trueA * trueB;

  // Bootstrap CI (500 iterations for responsiveness)
  const bootstrapResults = useMemo(
    () => bootstrapIndirectEffectBatch(data.x, data.m, data.y, 500, 99),
    [data]
  );
  const ci = useMemo(() => percentileCI(bootstrapResults), [bootstrapResults]);
  const isSignificant = ci[0] > 0 || ci[1] < 0;

  return (
    <div className="section-intro">
      <h2>Confounding the M&rarr;Y Path</h2>

      <p className="intro-text">
        This demonstration shows what happens when an unmeasured confounder U
        affects both M and Y. Even when the true causal effect of M on Y is
        zero (no real mediation), the confounder creates a spurious correlation
        between M and Y that the mediation model misattributes to a
        causal M &rarr; Y path.
      </p>

      <div className="controls-row">
        <div className="control-group">
          <label>True <em>a</em>-path (X &rarr; M)</label>
          <input
            type="range"
            min={0}
            max={1.0}
            step={0.05}
            value={trueA}
            onChange={(e) => setTrueA(Number(e.target.value))}
          />
          <span className="control-value">{trueA.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>True <em>b</em>-path (M &rarr; Y)</label>
          <input
            type="range"
            min={0}
            max={1.0}
            step={0.05}
            value={trueB}
            onChange={(e) => setTrueB(Number(e.target.value))}
          />
          <span className="control-value">{trueB.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>True <em>c'</em> (direct X &rarr; Y)</label>
          <input
            type="range"
            min={0}
            max={1.0}
            step={0.05}
            value={trueCPrime}
            onChange={(e) => setTrueCPrime(Number(e.target.value))}
          />
          <span className="control-value">{trueCPrime.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>U &rarr; M strength</label>
          <input
            type="range"
            min={0}
            max={1.0}
            step={0.05}
            value={uToM}
            onChange={(e) => setUToM(Number(e.target.value))}
          />
          <span className="control-value">{uToM.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>U &rarr; Y strength</label>
          <input
            type="range"
            min={0}
            max={1.0}
            step={0.05}
            value={uToY}
            onChange={(e) => setUToY(Number(e.target.value))}
          />
          <span className="control-value">{uToY.toFixed(2)}</span>
        </div>
      </div>

      <div className="dual-panel">
        <div className="comparison-panel">
          <h5>True Causal Model</h5>
          <div className="path-diagram-container">
            <PathDiagram
              aLabel={`a = ${trueA.toFixed(2)}`}
              bLabel={`b = ${trueB.toFixed(2)}`}
              cPrimeLabel={`c' = ${trueCPrime.toFixed(2)}`}
              showConfounder={true}
              confounderLabel="U (unmeasured)"
              confounderToMLabel={uToM.toFixed(2)}
              confounderToYLabel={uToY.toFixed(2)}
            />
          </div>
          <p className="intro-text" style={{ textAlign: 'center' }}>
            True indirect effect: <em>a</em> &times; <em>b</em> ={' '}
            {trueIndirect.toFixed(3)}
          </p>
        </div>

        <div className="comparison-panel">
          <h5>What the Researcher Estimates</h5>
          <div className="path-diagram-container">
            <PathDiagram
              aLabel={`\u00e2 = ${aHat.toFixed(2)}`}
              bLabel={`b\u0302 = ${bHat.toFixed(2)}`}
              cPrimeLabel={`\u0109' = ${cPrimeHat.toFixed(2)}`}
            />
          </div>
          <p className="intro-text" style={{ textAlign: 'center' }}>
            Estimated indirect effect: <em>\u00e2</em> &times;{' '}
            <em>b&#x0302;</em> = {estimatedIndirect.toFixed(3)}
          </p>
        </div>
      </div>

      <div className="results-row">
        <div className="result-card">
          <h5>True indirect (<em>a</em> &times; <em>b</em>)</h5>
          <div className="result-value">{trueIndirect.toFixed(3)}</div>
        </div>

        <div className="result-card">
          <h5>Estimated indirect (<em>\u00e2</em> &times; <em>b&#x0302;</em>)</h5>
          <div className="result-value">{estimatedIndirect.toFixed(3)}</div>
        </div>

        <div className="result-card">
          <h5>Bootstrap 95% CI</h5>
          <div className="result-value">
            [{ci[0].toFixed(3)}, {ci[1].toFixed(3)}]
          </div>
        </div>

        <div className={`result-card ${isSignificant ? 'significant' : 'not-significant'}`}>
          <h5>Significant?</h5>
          <div className="result-value">
            {isSignificant ? 'Yes' : 'No'}
          </div>
          <div className="result-detail">
            CI {isSignificant ? 'excludes' : 'includes'} zero
          </div>
        </div>
      </div>

      <div className="warning-insight">
        <h4>Confounding produces a spurious indirect effect</h4>
        <p>
          The researcher would conclude that mediation is statistically
          significant — the bootstrap CI excludes zero. But the true indirect
          effect is zero. The entire estimated indirect effect is an artifact of
          the unmeasured confounder U. This illustrates Rohrer et al.'s point:
          the bootstrap addresses sampling error, not causal validity. Try
          moving the "True <em>b</em>-path" slider above zero to see what
          happens when real mediation exists alongside confounding.
        </p>
      </div>
    </div>
  );
}
