import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ScrollingNarrative from './components/ScrollingNarrative';
import OutlierExclusions from './components/OutlierExclusions';
import NHST from './components/NHST';
import ANOVA from './components/ANOVA';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/sampling-distributions"
            element={<ScrollingNarrative sampleSize={15} />}
          />
          <Route path="/nhst" element={<NHST />} />
          <Route path="/anova" element={<ANOVA />} />
          <Route path="/outlier-exclusions" element={<OutlierExclusions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
