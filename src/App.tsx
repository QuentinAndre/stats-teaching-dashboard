import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ScrollingNarrative from './components/ScrollingNarrative';
import OutlierExclusions from './components/OutlierExclusions';
import NHST from './components/NHST';
import ANOVA from './components/ANOVA';
import EffectSizesPower from './components/EffectSizesPower';
import FactorialANOVA from './components/FactorialANOVA';
import WithinSubjects from './components/WithinSubjects';
import MixedDesigns from './components/MixedDesigns';
import ContinuousInteractions from './components/ContinuousInteractions';
import PHacking from './components/PHacking';
import PRIAD from './components/PRIAD';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/sampling-distributions"
            element={<ScrollingNarrative sampleSize={15} />}
          />
          <Route path="/nhst" element={<NHST />} />
          <Route path="/anova" element={<ANOVA />} />
          <Route path="/effect-sizes-power" element={<EffectSizesPower />} />
          <Route path="/factorial-anova" element={<FactorialANOVA />} />
          <Route path="/continuous-interactions" element={<ContinuousInteractions />} />
          <Route path="/within-subjects" element={<WithinSubjects />} />
          <Route path="/mixed-designs" element={<MixedDesigns />} />
          <Route path="/outlier-exclusions" element={<OutlierExclusions />} />
          <Route path="/p-hacking" element={<PHacking />} />
          <Route path="/priad" element={<PRIAD />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
