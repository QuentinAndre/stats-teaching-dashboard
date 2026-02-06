import { useState, useMemo } from 'react';
import { requiredSampleSize, calculatePower } from '../../../utils/statistics';

type EffectSizePreset = 'small' | 'medium' | 'large' | 'custom';

export default function StudyPlanning() {
  const [effectSizePreset, setEffectSizePreset] = useState<EffectSizePreset>('medium');
  const [customD, setCustomD] = useState(0.5);
  const [targetPower, setTargetPower] = useState(0.80);
  const [alpha, setAlpha] = useState(0.05);

  // Get the actual d value based on preset or custom
  const effectSize = useMemo(() => {
    switch (effectSizePreset) {
      case 'small':
        return 0.2;
      case 'medium':
        return 0.5;
      case 'large':
        return 0.8;
      case 'custom':
        return customD;
    }
  }, [effectSizePreset, customD]);

  // Calculate required sample size
  const requiredN = useMemo(() => {
    return requiredSampleSize(effectSize, targetPower, alpha);
  }, [effectSize, targetPower, alpha]);

  // Calculate total participants needed
  const totalParticipants = requiredN * 2;

  // Generate comparison table
  const comparisonTable = useMemo(() => {
    const effectSizes = [0.2, 0.5, 0.8];
    const powers = [0.80, 0.90, 0.95];
    const alphas = [0.05, 0.01];

    const rows: {
      d: number;
      power: number;
      alpha: number;
      n: number;
      total: number;
    }[] = [];

    for (const d of effectSizes) {
      for (const power of powers) {
        for (const a of alphas) {
          const n = requiredSampleSize(d, power, a);
          rows.push({ d, power, alpha: a, n, total: n * 2 });
        }
      }
    }

    return rows;
  }, []);

  // Calculate cost comparison (n needed relative to large effect)
  const costMultiplier = useMemo(() => {
    const nSmall = requiredSampleSize(0.2, 0.80, 0.05);
    const nLarge = requiredSampleSize(0.8, 0.80, 0.05);
    return Math.round(nSmall / nLarge);
  }, []);

  // Verify the calculated n achieves target power
  const achievedPower = calculatePower(effectSize, requiredN, alpha);

  return (
    <div className="section-intro">
      <h2>Planning Your Study</h2>

      <p className="intro-text">
        <strong>A priori power analysis</strong> determines how many participants you need
        <em> before</em> running a study. This is the responsible approach to research design—it
        ensures your study has a reasonable chance of detecting the effect you're interested in,
        avoiding wasted resources on underpowered studies.
      </p>

      <div className="key-insight">
        <h4>When to Do Power Analysis</h4>
        <p>
          Power analysis should be done <strong>before</strong> data collection, not after. Post-hoc
          power analysis (calculating power after seeing results) is widely criticized because
          observed power is mathematically determined by the p-value and adds no new information.
          Plan your sample size in advance.
        </p>
      </div>

      <h3>Sample Size Calculator</h3>

      <div className="viz-container">
        <h4>A Priori Power Analysis for Two-Group Comparison</h4>

        <div className="calculator-inputs">
          <div className="calculator-input">
            <label>Expected Effect Size</label>
            <select
              value={effectSizePreset}
              onChange={(e) => setEffectSizePreset(e.target.value as EffectSizePreset)}
            >
              <option value="small">Small (d = 0.2)</option>
              <option value="medium">Medium (d = 0.5)</option>
              <option value="large">Large (d = 0.8)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {effectSizePreset === 'custom' && (
            <div className="calculator-input">
              <label>Custom d Value</label>
              <input
                type="number"
                min="0.1"
                max="2.0"
                step="0.1"
                value={customD}
                onChange={(e) => setCustomD(Number(e.target.value))}
              />
            </div>
          )}

          <div className="calculator-input">
            <label>Desired Power</label>
            <select
              value={targetPower}
              onChange={(e) => setTargetPower(Number(e.target.value))}
            >
              <option value={0.80}>80%</option>
              <option value={0.90}>90%</option>
              <option value={0.95}>95%</option>
            </select>
          </div>

          <div className="calculator-input">
            <label>Significance Level (α)</label>
            <select
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
            >
              <option value={0.05}>0.05</option>
              <option value={0.01}>0.01</option>
              <option value={0.001}>0.001</option>
            </select>
          </div>
        </div>

        <div className="calculator-result">
          <div className="result-title">Required Sample Size</div>
          <div className="result-number">{requiredN}</div>
          <div className="result-unit">participants per group</div>
        </div>

        <div className="results-row">
          <div className="result-card">
            <div className="result-label">Total N</div>
            <div className="result-value highlight">{totalParticipants}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Effect Size (d)</div>
            <div className="result-value">{effectSize.toFixed(2)}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Achieved Power</div>
            <div className="result-value">{(achievedPower * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <h3>The Cost of Detecting Small Effects</h3>

      <p className="intro-text">
        Sample size requirements increase dramatically as expected effect size decreases. Detecting
        a small effect (d = 0.2) requires approximately <strong>{costMultiplier}×</strong> more
        participants than detecting a large effect (d = 0.8). This has important implications for
        research planning and resource allocation.
      </p>

      <table className="sample-size-table">
        <thead>
          <tr>
            <th>Effect Size</th>
            <th>Power</th>
            <th>α</th>
            <th>n per group</th>
            <th>Total N</th>
          </tr>
        </thead>
        <tbody>
          {comparisonTable
            .filter((row) => row.power === 0.80 && row.alpha === 0.05)
            .map((row, i) => (
              <tr
                key={i}
                className={row.d === effectSize ? 'highlight-row' : ''}
              >
                <td>
                  <span className={`effect-badge ${row.d === 0.2 ? 'small' : row.d === 0.5 ? 'medium' : 'large'}`}>
                    {row.d === 0.2 ? 'Small' : row.d === 0.5 ? 'Medium' : 'Large'}
                  </span>
                  {' '}(d = {row.d})
                </td>
                <td>{(row.power * 100).toFixed(0)}%</td>
                <td>{row.alpha}</td>
                <td>{row.n}</td>
                <td>{row.total}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h3>Quick Reference: n per Group (α = .05, Power = 80%)</h3>

      <p className="intro-text">
        For quick estimates, use Cohen's rule of thumb: <span className="math">n ≈ 16/d²</span> per
        group. This approximation works well for two-tailed tests with α = .05 and 80% power.
      </p>

      <table className="effect-size-table">
        <thead>
          <tr>
            <th>d</th>
            <th>0.2</th>
            <th>0.3</th>
            <th>0.4</th>
            <th>0.5</th>
            <th>0.6</th>
            <th>0.8</th>
            <th>1.0</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600 }}>n per group</td>
            <td>{requiredSampleSize(0.2, 0.80, 0.05)}</td>
            <td>{requiredSampleSize(0.3, 0.80, 0.05)}</td>
            <td>{requiredSampleSize(0.4, 0.80, 0.05)}</td>
            <td>{requiredSampleSize(0.5, 0.80, 0.05)}</td>
            <td>{requiredSampleSize(0.6, 0.80, 0.05)}</td>
            <td>{requiredSampleSize(0.8, 0.80, 0.05)}</td>
            <td>{requiredSampleSize(1.0, 0.80, 0.05)}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Total N</td>
            <td>{requiredSampleSize(0.2, 0.80, 0.05) * 2}</td>
            <td>{requiredSampleSize(0.3, 0.80, 0.05) * 2}</td>
            <td>{requiredSampleSize(0.4, 0.80, 0.05) * 2}</td>
            <td>{requiredSampleSize(0.5, 0.80, 0.05) * 2}</td>
            <td>{requiredSampleSize(0.6, 0.80, 0.05) * 2}</td>
            <td>{requiredSampleSize(0.8, 0.80, 0.05) * 2}</td>
            <td>{requiredSampleSize(1.0, 0.80, 0.05) * 2}</td>
          </tr>
        </tbody>
      </table>

      <h3>Where Does the Expected Effect Size Come From?</h3>

      <p className="intro-text">
        The hardest part of power analysis is specifying the expected effect size. Here are some
        approaches:
      </p>

      <div className="formula-box">
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Prior research</span>
            <span className="explanation">
              Use effect sizes from similar studies. Be cautious—published effects are often
              inflated due to publication bias and selective reporting.
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Pilot data</span>
            <span className="explanation">
              Run a small pilot study to estimate the effect. Note that pilot estimates are noisy
              and may overestimate or underestimate the true effect.
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SESOI</span>
            <span className="explanation">
              Define the <strong>smallest effect size of interest</strong>—the minimum effect that
              would be practically meaningful. Power your study to detect this.
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Safeguard</span>
            <span className="explanation">
              Use the lower bound of a confidence interval from prior research (Perugini et al.,
              2014). This protects against overestimating the effect.
            </span>
          </div>
        </div>
      </div>

      <div className="key-insight">
        <h4>The Replication Crisis Connection</h4>
        <p>
          Many failed replications can be attributed to underpowered original studies. An underpowered
          study that happens to find a significant result likely overestimates the true effect
          (winner's curse). When a replication study is powered based on this inflated estimate, it
          may fail even if the effect is real. Adequately powered studies produce more reliable
          effect size estimates.
        </p>
      </div>
    </div>
  );
}
