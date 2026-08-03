import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReadinessForm from '../components/ReadinessForm';
import ScoreBreakdown from '../components/ScoreBreakdown';
import StrengthsWeaknesses from '../components/StrengthsWeaknesses';
import RecommendationsList from '../components/RecommendationsList';

export default function ReadinessInputPage() {
  const [report, setReport] = useState(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Election Readiness Engine</h1>
        <Link to="/readiness/history" className="text-sm text-brand-600 hover:underline">
          My Reports →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadinessForm onCalculated={setReport} />

        {report && (
          <div className="space-y-4">
            <ScoreBreakdown report={report} />
            <StrengthsWeaknesses strengths={report.strengths} weaknesses={report.weaknesses} />
            <RecommendationsList recommendations={report.recommendations} />
          </div>
        )}
      </div>
    </div>
  );
}
