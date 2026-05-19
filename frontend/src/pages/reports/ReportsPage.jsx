import { useEffect, useState } from 'react';
import { FileText, Download, Plus, Loader2 } from 'lucide-react';
import { api } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  const downloadReport = async (id) => {
    setDownloadingId(id);
    try {
      const response = await api.get(`/reports/generate/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `RASA-CHAIN-Report-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingId('');
    }
  };

  const loadQualityReports = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/quality/batch/${batchId}`);
      setReports(data.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileText className="w-6 h-6 text-indigo-400" />
          Reports & Compliance
        </h1>
        <p className="text-gray-400 text-sm mt-1">Generate PDF compliance reports and view quality lab reports</p>
      </div>

      {/* PDF Generation */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Generate Compliance PDF</h2>
        <div className="flex gap-3">
          <input
            value={batchId}
            onChange={(e) => setBatchId(e.target.value.toUpperCase())}
            placeholder="Enter Batch ID (e.g. RC-XXXXX-XXXXXX)"
            className="input-field flex-1"
          />
          <button
            onClick={() => downloadReport(batchId)}
            disabled={!batchId || downloadingId === batchId}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {downloadingId === batchId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingId === batchId ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={loadQualityReports} disabled={!batchId || loading} className="btn-secondary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Quality Reports'}
          </button>
        </div>
      </div>

      {/* Quality Reports List */}
      {reports.length > 0 && (
        <div className="glass-card">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-white">Quality Lab Reports for {batchId}</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {reports.map((report) => (
              <div key={report._id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{report.labName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Report ID: {report.reportId} · Tested: {report.testDate ? format(new Date(report.testDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${report.overallResult === 'passed' ? 'badge-verified' : 'badge-rejected'}`}>
                    {report.grade} · {report.overallResult}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {reports.length === 0 && (
        <div className="glass-card p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a Batch ID above to generate PDF reports or view quality lab reports</p>
        </div>
      )}
    </div>
  );
}
