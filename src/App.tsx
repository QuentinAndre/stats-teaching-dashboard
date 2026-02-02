import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ScrollingNarrative from './components/ScrollingNarrative';
import OutlierExclusions from './components/OutlierExclusions';
import NHST from './components/NHST';
import ANOVA from './components/ANOVA';
import FactorialANOVA from './components/FactorialANOVA';
import WithinSubjects from './components/WithinSubjects';
import PHacking from './components/PHacking';

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
          <Route path="/factorial-anova" element={<FactorialANOVA />} />
          <Route path="/within-subjects" element={<WithinSubjects />} />
          <Route path="/outlier-exclusions" element={<OutlierExclusions />} />
          <Route path="/p-hacking" element={<PHacking />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
