import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Link2, QrCode,
  MapPin, Download, Package, Leaf, Shield, Cpu, FileText,
  AlertTriangle, ChevronDown
} from 'lucide-react';
import { api } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const EVENT_ICONS = {
  harvest: '🌿', lab_testing: '🔬', manufacturing: '🏭',
  packaging: '📦', distribution: '🚛', verification: '✅', verified: '✅', custom: '📋',
};

const EVENT_COLORS = {
  harvest: 'bg-green-500',
  lab_testing: 'bg-blue-500',
  manufacturing: 'bg-purple-500',
  packaging: 'bg-amber-500',
  distribution: 'bg-pink-500',
  verification: 'bg-emerald-500',
  verified: 'bg-emerald-500',
  custom: 'bg-gray-500',
};

export default function BatchDetailPage() {
  const { id } = useParams();
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [blockchainHistory, setBlockchainHistory] = useState([]);
  const [chainValid, setChainValid] = useState(true);
  const [stageUpdate, setStageUpdate] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchRes, qrRes, chainRes] = await Promise.all([
          api.get(`/batches/${id}`),
          api.get(`/qr/${id}`).catch(() => ({ data: { data: {} } })),
          api.get(`/blockchain/batch/${id}`).catch(() => ({ data: { data: [], chainIntegrity: { valid: true } } })),
        ]);
        setBatch(batchRes.data.data);
        setQrCode(qrRes.data.data?.qrCode || '');
        setBlockchainHistory(chainRes.data.data || []);
        setChainValid(chainRes.data.chainIntegrity?.valid !== false);
      } catch (err) {
        toast.error('Batch not found');
        navigate('/batches');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleStageUpdate = async (e) => {
    e.preventDefault();
    setUpdatingStage(true);
    try {
      const { data } = await api.patch(`/batches/${batch.batchId}/stage`, { stage: stageUpdate, notes: stageNotes });
      setBatch(data.data);
      toast.success(`Stage updated to ${stageUpdate} · TX: ${data.blockchain.txHash.slice(0, 16)}...`);
      setStageUpdate(''); setStageNotes('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleApproval = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch(`/batches/${batch.batchId}/approve`, { status: approvalStatus, comments: approvalComments });
      setBatch(data.data);
      toast.success(`Batch ${approvalStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    }
  };

  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await api.get(`/reports/generate/${batch.batchId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `RASA-CHAIN-${batch.batchId}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      toast.error('PDF generation failed');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div className="page-container max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{batch.herbName}</h1>
            <span className="font-mono text-sm text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {batch.batchId}
            </span>
            {batch.isVerified ? (
              <span className="badge-verified badge flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
            ) : batch.status === 'rejected' ? (
              <span className="badge-rejected badge flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
            ) : (
              <span className="badge-pending badge flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
            )}
            {!chainValid && (
              <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Tamper Alert
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">{batch.productName} · {batch.productCategory?.replace(/_/g, ' ')}</p>
        </div>
        <button onClick={downloadPDF} disabled={downloadingPDF} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          {downloadingPDF ? 'Generating...' : 'PDF Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Blockchain Hash */}
          <div className="glass-card p-5 border-l-4 border-indigo-500">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <p className="text-sm font-semibold text-white">Blockchain Record</p>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${chainValid ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                {chainValid ? '✓ Chain Intact' : '⚠ Tampered'}
              </span>
            </div>
            <p className="font-mono text-xs text-indigo-400 break-all">{batch.blockchainTxHash || 'Not recorded'}</p>
            <p className="text-xs text-gray-500 mt-1">Network: {batch.blockchainNetwork} · Block: #{batch.blockNumber}</p>
          </div>

          {/* Supply Chain Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Supply Chain Timeline
            </h3>
            {batch.supplyChainEvents?.length === 0 ? (
              <p className="text-gray-500 text-sm">No events recorded yet.</p>
            ) : (
              <div className="space-y-0">
                {batch.supplyChainEvents?.map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl ${EVENT_COLORS[event.eventType] || 'bg-gray-500'} flex items-center justify-center text-lg flex-shrink-0`}>
                        {EVENT_ICONS[event.eventType] || '📋'}
                      </div>
                      {i < batch.supplyChainEvents.length - 1 && (
                        <div className="w-0.5 h-8 bg-white/10 my-1" />
                      )}
                    </div>
                    <div className={`pb-6 ${i < batch.supplyChainEvents.length - 1 ? '' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white capitalize">
                          {event.eventType?.replace(/_/g, ' ')}
                        </p>
                        {event.txHash && (
                          <span className="hash-text">{event.txHash?.slice(0, 16)}...</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.performedByName} · {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                      {event.notes && <p className="text-xs text-gray-500 mt-1 bg-white/[0.02] rounded-lg px-3 py-2">{event.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blockchain History */}
          {blockchainHistory.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-400" />
                Blockchain Records ({blockchainHistory.length})
              </h3>
              <div className="space-y-2">
                {blockchainHistory.map((log) => (
                  <div key={log._id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/20 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.isValid ? 'bg-emerald-400' : 'bg-red-400'} node-pulse`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white capitalize">{log.eventType?.replace(/_/g, ' ')}</span>
                        {!log.isValid && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      </div>
                      <p className="font-mono text-[10px] text-indigo-400 truncate">{log.txHash}</p>
                      <p className="text-[10px] text-gray-600">{format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')} · Block #{log.blockNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage Update (for authorized roles) */}
          {hasRole('manufacturer', 'lab', 'admin') && batch.status !== 'rejected' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Update Processing Stage</h3>
              <form onSubmit={handleStageUpdate} className="flex flex-col sm:flex-row gap-3">
                <select value={stageUpdate} onChange={(e) => setStageUpdate(e.target.value)} className="input-field" required>
                  <option value="" style={{ background: '#111128' }}>Select new stage...</option>
                  {['lab_testing', 'manufacturing', 'packaging', 'distributed', 'verified'].map(s => (
                    <option key={s} value={s} style={{ background: '#111128' }}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <input value={stageNotes} onChange={(e) => setStageNotes(e.target.value)} className="input-field" placeholder="Notes (optional)" />
                <button type="submit" disabled={updatingStage || !stageUpdate} className="btn-primary whitespace-nowrap flex items-center gap-2">
                  {updatingStage ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Recording...</> : 'Record on Chain'}
                </button>
              </form>
            </div>
          )}

          {/* Regulatory Approval */}
          {hasRole('regulator', 'admin') && batch.regulatoryApproval?.status === 'pending' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Regulatory Review
              </h3>
              <form onSubmit={handleApproval} className="space-y-3">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setApprovalStatus('approved')}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold text-sm ${approvalStatus === 'approved' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-white/10 text-gray-400 hover:border-emerald-500/30'}`}>
                    ✓ Approve
                  </button>
                  <button type="button" onClick={() => setApprovalStatus('rejected')}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold text-sm ${approvalStatus === 'rejected' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/10 text-gray-400 hover:border-red-500/30'}`}>
                    ✗ Reject
                  </button>
                </div>
                <textarea value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} className="input-field h-20 resize-none" placeholder="Regulatory comments..." />
                <button type="submit" disabled={!approvalStatus} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${approvalStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : approvalStatus === 'rejected' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                  Submit Decision & Record on Blockchain
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="glass-card p-6 text-center">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-400" />
              Verification QR Code
            </h3>
            {qrCode ? (
              <div>
                <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl border border-white/10" />
                <p className="text-xs text-gray-500 mt-2">Scan to verify on any device</p>
                <Link to={`/verify/${batch.batchId}`} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 block">
                  Open verification page →
                </Link>
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto bg-white/[0.03] rounded-xl border border-white/10 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-700" />
              </div>
            )}
          </div>

          {/* Batch Info */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Batch Details</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Harvest Date', value: batch.harvestDate ? format(new Date(batch.harvestDate), 'MMM d, yyyy') : 'N/A' },
                { label: 'Mfg Date', value: batch.manufacturingDate ? format(new Date(batch.manufacturingDate), 'MMM d, yyyy') : 'N/A' },
                { label: 'Expiry', value: batch.expiryDate ? format(new Date(batch.expiryDate), 'MMM d, yyyy') : 'N/A' },
                { label: 'Grade', value: batch.qualityGrade || 'Pending' },
                { label: 'Certifications', value: batch.certifications?.join(', ') || 'None' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">{label}</span>
                  <span className="text-gray-300 text-right text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier & Manufacturer */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Supply Chain Actors</h3>
            <div>
              <p className="text-xs text-gray-500 mb-1">Supplier</p>
              <p className="text-sm text-white font-medium">{batch.supplier?.name || batch.supplierName || 'N/A'}</p>
              <p className="text-xs text-gray-500">{batch.supplier?.organization || batch.supplierOrganization || ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Manufacturer</p>
              <p className="text-sm text-white font-medium">{batch.manufacturer?.name || batch.manufacturerName || 'N/A'}</p>
              <p className="text-xs text-gray-500">{batch.manufacturer?.organization || batch.manufacturerOrganization || ''}</p>
            </div>
            {batch.harvestLocation?.city && (
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</p>
                <p className="text-sm text-white">{batch.harvestLocation.city}, {batch.harvestLocation.state}</p>
              </div>
            )}
          </div>

          {/* Regulatory Status */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Regulatory Status
            </h3>
            <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${
              batch.regulatoryApproval?.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              batch.regulatoryApproval?.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {batch.regulatoryApproval?.status?.toUpperCase() || 'PENDING'}
            </div>
            {batch.regulatoryApproval?.comments && (
              <p className="text-xs text-gray-500 mt-2">{batch.regulatoryApproval.comments}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
