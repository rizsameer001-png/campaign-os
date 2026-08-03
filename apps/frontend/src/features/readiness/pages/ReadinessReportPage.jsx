import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../lib/api';
import ScoreBreakdown from '../components/ScoreBreakdown';
import StrengthsWeaknesses from '../components/StrengthsWeaknesses';
import RecommendationsList from '../components/RecommendationsList';
import Button from '../../../components/common/Button';

export default function ReadinessReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    api.get(`/readiness/reports/${id}`).then(({ data }) => setReport(data.data));
  }, [id]);

  async function handleShare() {
    const { data } = await api.post(`/readiness/reports/${id}/share`);
    setShareUrl(`${window.location.origin}/shared-report/${data.data.token}`);
  }

  if (!report) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Readiness Report</h1>
        <Button variant="secondary" onClick={handleShare}>Share link (7 days)</Button>
      </div>
      {shareUrl && <p className="text-xs text-gray-500 break-all">{shareUrl}</p>}

      <ScoreBreakdown report={report} />
      <StrengthsWeaknesses strengths={report.strengths} weaknesses={report.weaknesses} />
      <RecommendationsList recommendations={report.recommendations} />
    </div>
  );
}
