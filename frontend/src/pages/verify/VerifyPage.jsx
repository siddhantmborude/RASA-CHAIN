import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Link2, Shield, Leaf, MapPin, Calendar, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const EVENT_EMOJIS = {
  harvest: '🌿', lab_testing: '🔬', manufacturing: '🏭',
  packaging: '📦', distribution: '🚛', verification: '✅',
  batch_created: '🆕', regulatory_approval: '🏛️',
};

export default function VerifyPage() {
  const { batchId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!batchId) { setLoading(false); return; }
    axios.get(`/api/verify/${batchId}`)
      .then(({ data: d }) => { setData(d); setLoading(false); })
      .catch((err) => {
        setError(err.response?.data?.error || 'Batch not found');
        setLoading(false);
      });
  }, [batchId]);

  if (!batchId) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chain-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying on blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chain-dark p-6">
        <div className="glass-card p-10 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Product Not Found</h1>
          <p className="text-gray-400 text-sm">{error}</p>
          <Link to="/verify" className="btn-primary mt-6 inline-block">Try Another</Link>
        </div>
      </div>
    );
  }

  const { batch, verified, tamperStatus, supplyChainTimeline, blockchainRecords, qualityReports } = data;

  return (
    <div className="min-h-screen bg-chain-dark">
      {/* Nav */}
      <nav className="flex items-center gap-4 px-6 py-4 border-b border-chain-border bg-chain-card/60 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-indigo-400" />
          <span className="font-bold gradient-text">RASA-CHAIN</span>
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">Product Verification</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Verification Result Banner */}
        <div className={`rounded-2xl p-6 mb-8 border-2 ${
          verified && tamperStatus.chainIntegrity
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : !tamperStatus.chainIntegrity
            ? 'border-red-500/40 bg-red-500/10'
            : 'border-amber-500/40 bg-amber-500/10'
        }`}>
          <div className="flex items-center gap-4">
            {verified && tamperStatus.chainIntegrity ? (
              <CheckCircle className="w-14 h-14 text-emerald-400 flex-shrink-0" />
            ) : !tamperStatus.chainIntegrity ? (
              <AlertTriangle className="w-14 h-14 text-red-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-14 h-14 text-amber-400 flex-shrink-0" />
            )}
            <div>
              <h1 className={`text-2xl font-black ${
                verified && tamperStatus.chainIntegrity ? 'text-emerald-400' :
                !tamperStatus.chainIntegrity ? 'text-red-400' : 'text-amber-400'
              }`}>
                {verified && tamperStatus.chainIntegrity
                  ? '✅ Authentic Product Verified'
                  : !tamperStatus.chainIntegrity
                  ? '⚠️ Tamper Alert Detected'
                  : '⏳ Verification Pending'}
              </h1>
              <p className="text-gray-300 mt-1">{tamperStatus.message}</p>
              <p className="text-gray-500 text-xs mt-1">Verified at {format(new Date(data.verificationTimestamp), 'MMM d, yyyy h:mm:ss a')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batch Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Info */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-400" />
                Product Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Batch ID', batch.batchId],
                  ['Herb Name', batch.herbName],
                  ['Scientific Name', batch.scientificName || 'N/A'],
                  ['Product Name', batch.productName],
                  ['Category', batch.productCategory?.replace(/_/g, ' ')],
                  ['Quality Grade', batch.qualityGrade || 'Pending'],
                  ['Status', batch.status],
                  ['Stage', batch.currentStage?.replace(/_/g, ' ')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-white mt-0.5">{value || 'N/A'}</p>
                  </div>
                ))}
              </div>

              {/* Blockchain */}
              <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs font-semibold text-indigo-400">Blockchain Verification Hash</p>
                </div>
                <p className="font-mono text-xs text-gray-400 break-all">{batch.blockchainTxHash || 'N/A'}</p>
                <p className="text-xs text-gray-600 mt-1">Network: {batch.blockchainNetwork}</p>
              </div>
            </div>

            {/* Supply Chain Timeline */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Traceability Timeline
              </h2>
              <div className="space-y-0">
                {supplyChainTimeline?.map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg flex-shrink-0">
                        {EVENT_EMOJIS[event.eventType] || '📋'}
                      </div>
                      {i < supplyChainTimeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-white/10 my-1" />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-semibold text-white capitalize">{event.eventType?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{event.performedByName || 'System'} · {format(new Date(event.timestamp), 'MMM d, yyyy')}</p>
                      {event.notes && <p className="text-xs text-gray-600 mt-1">{event.notes}</p>}
                      {event.txHash && (
                        <p className="font-mono text-[10px] text-indigo-400/70 mt-1">{event.txHash.slice(0, 30)}...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockchain Records */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Blockchain Records ({blockchainRecords?.length || 0})</h2>
              <div className="space-y-2">
                {blockchainRecords?.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.isValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white capitalize">{log.eventType?.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-gray-600">Block #{log.blockNumber}</span>
                      </div>
                      <p className="font-mono text-[10px] text-indigo-400/70 truncate">{log.txHash}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Origin</h3>
              {batch.harvestLocation?.city && (
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white">{batch.harvestLocation.city}</p>
                    <p className="text-xs text-gray-500">{batch.harvestLocation.state}, {batch.harvestLocation.country}</p>
                  </div>
                </div>
              )}
              <div className="space-y-3 text-sm">
                {[
                  ['Supplier', batch.supplier?.name || 'N/A'],
                  ['Manufacturer', batch.manufacturer?.name || 'N/A'],
                  ['Harvest', batch.harvestDate ? format(new Date(batch.harvestDate), 'MMM d, yyyy') : 'N/A'],
                  ['Expiry', batch.expiryDate ? format(new Date(batch.expiryDate), 'MMM d, yyyy') : 'N/A'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-3">Regulatory Status</h3>
              <div className={`px-4 py-3 rounded-xl font-semibold text-sm text-center ${
                batch.regulatoryApproval?.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                batch.regulatoryApproval?.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {batch.regulatoryApproval?.status?.toUpperCase() || 'PENDING'}
              </div>
              {batch.certifications?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {batch.certifications.map((cert) => (
                      <span key={cert} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {qualityReports?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Quality Reports</h3>
                {qualityReports.map((report) => (
                  <div key={report._id} className="text-sm space-y-1">
                    <p className="text-white font-medium">{report.labName}</p>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${report.overallResult === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {report.overallResult?.toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-500">Grade: {report.grade}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="glass-card p-4 text-center">
              <p className="text-xs text-gray-500 mb-3">Powered by</p>
              <div className="flex items-center justify-center gap-2">
                <Leaf className="w-4 h-4 text-indigo-400" />
                <span className="font-bold gradient-text text-sm">RASA-CHAIN</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Blockchain Traceability Platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
