import SamplingIntro from './sections/SamplingIntro';
import SamplingDistributionSection from './sections/SamplingDistributionSection';
import SkewedSamplingSection from './sections/SkewedSamplingSection';
import HeterogeneityComparisonSection from './sections/HeterogeneityComparisonSection';
import SampleSizeComparisonSection from './sections/SampleSizeComparisonSection';
import SamplingDistributionSummary from './sections/SamplingDistributionSummary';
import NavigationPane from './NavigationPane';
import ModuleNavigation from '../ModuleNavigation';

interface ScrollingNarrativeProps {
  /** Sample size for the sampling demonstration */
  sampleSize?: number;
}

export default function ScrollingNarrative({ sampleSize = 15 }: ScrollingNarrativeProps) {
  return (
    <div className="scrolling-narrative">
      <NavigationPane />

      <header className="narrative-header">
        <h1>Understanding Statistical Sampling</h1>
        <p className="subtitle">Scroll down to explore the concepts</p>
      </header>

      <div id="sampling-intro">
        <SamplingIntro sampleSize={sampleSize} />
      </div>

      <div id="sampling-distribution">
        <SamplingDistributionSection sampleSize={sampleSize} numberOfSamples={500} />
      </div>

      <div id="skewed-sampling">
        <SkewedSamplingSection sampleSize={sampleSize} numberOfSamples={500} />
      </div>

      <div id="heterogeneity-comparison">
        <HeterogeneityComparisonSection sampleSize={sampleSize} numberOfSamples={500} />
      </div>

      <div id="sample-size-comparison">
        <SampleSizeComparisonSection numberOfSamples={500} />
      </div>

      <div id="sampling-summary">
        <SamplingDistributionSummary />
      </div>

      <ModuleNavigation currentPath="/sampling-distributions" />
    </div>
  );
}
