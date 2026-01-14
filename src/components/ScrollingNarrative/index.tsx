import SamplingIntro from './sections/SamplingIntro';
import SamplingDistributionSection from './sections/SamplingDistributionSection';

interface ScrollingNarrativeProps {
  /** Sample size for the sampling demonstration */
  sampleSize?: number;
}

export default function ScrollingNarrative({ sampleSize = 25 }: ScrollingNarrativeProps) {
  return (
    <div className="scrolling-narrative">
      <header className="narrative-header">
        <h1>Understanding Statistical Sampling</h1>
        <p className="subtitle">Scroll down to explore the concepts</p>
      </header>

      <SamplingIntro sampleSize={sampleSize} />

      <SamplingDistributionSection sampleSize={sampleSize} numberOfSamples={200} />

      <footer className="narrative-footer">
        <p>More concepts coming soon...</p>
      </footer>
    </div>
  );
}
