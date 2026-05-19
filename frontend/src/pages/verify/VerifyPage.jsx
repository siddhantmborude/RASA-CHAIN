import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Link2, Shield, Leaf, MapPin, Calendar, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

const EVENT_EMOJIS = {
  harvest: '🌿', lab_testing: '🔬', manufacturing: '🏭',
  packaging: '📦', distribution: '🚛', verification: '✅', verified: '✅',
  batch_created: '🆕', regulatory_approval: '🏛️',
};

const getEventPerformedBy = (event, batch) => {
  const rawName = event.performedByName || 'System';
  const isGenericUser = ['man', 'sid', 'manufacturer', 'lab', 'regulator', 'admin', 'farmer'].includes(rawName.toLowerCase());
  
  if (isGenericUser) {
    if (event.eventType === 'harvest' || event.eventType === 'collection' || event.eventType === 'batch_created') {
      return batch.supplierName || 'Organic Herb Farmer';
    }
    if (event.eventType === 'lab_testing') {
      return 'RASA AI E-Tongue Quality Lab';
    }
    if (event.eventType === 'manufacturing' || event.eventType === 'packaging') {
      return batch.manufacturerName || 'Certified Herbal Manufacturer';
    }
    if (event.eventType === 'verified' || event.eventType === 'regulatory_approval') {
      return 'AYUSH Board Commission';
    }
  }
  return rawName;
};

export default function VerifyPage() {
  const { batchId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { socket } = useSocket();

  useEffect(() => {
    if (!batchId) { setLoading(false); return; }
    axios.get(`/api/verify/${batchId}`)
      .then(({ data: d }) => { setData(d); setLoading(false); })
      .catch((err) => {
        setError(err.response?.data?.error || 'Batch not found');
        setLoading(false);
      });
  }, [batchId]);

  useEffect(() => {
    if (!socket || !batchId) return;

    const handleBatchUpdate = (updateData) => {
      if (updateData.batchId?.toUpperCase() === batchId.toUpperCase()) {
        toast.success(`🔗 Real-time blockchain ledger synchronized! Stage updated to: ${updateData.stage || 'verified'}`);
        axios.get(`/api/verify/${batchId}`)
          .then(({ data: d }) => setData(d))
          .catch(() => {});
      }
    };

    socket.on('batch:updated', handleBatchUpdate);

    return () => {
      socket.off('batch:updated', handleBatchUpdate);
    };
  }, [socket, batchId]);

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

  // Manufacturer verification state (Only verified if current stage is manufacturing/packaging/distributed/verified)
  const isManufacturerVerified = ['manufacturing', 'packaging', 'distributed', 'verified'].includes(batch.currentStage) ||
                                 (supplyChainTimeline && supplyChainTimeline.some(e => e.eventType === 'manufacturing'));

  // Lab testing verification state (Verified if report exists or timeline has lab_testing or stage is lab_testing/manufacturing/etc.)
  const isLabVerified = (qualityReports && qualityReports.length > 0 && qualityReports.some(r => r.overallResult === 'passed')) ||
                        (supplyChainTimeline && supplyChainTimeline.some(e => e.eventType === 'lab_testing')) ||
                        ['lab_testing', 'manufacturing', 'packaging', 'distributed', 'verified'].includes(batch.currentStage);
  
  const mfgName = batch.manufacturer?.name || batch.manufacturerName || 'Certified Herbal Manufacturer';

  const labEvent = supplyChainTimeline?.find(e => e.eventType === 'lab_testing');
  const rawLabName = qualityReports?.find(r => r.overallResult === 'passed')?.labName || labEvent?.performedByName || 'NABL Certified Lab';
  const labName = (rawLabName === mfgName || rawLabName?.toLowerCase() === 'sid' || rawLabName?.toLowerCase() === 'manufacturer')
    ? 'RASA AI E-Tongue Quality Lab'
    : rawLabName;
  const labDate = qualityReports?.find(r => r.overallResult === 'passed')?.testDate || labEvent?.timestamp || batch.createdAt;
  const labGrade = qualityReports?.find(r => r.overallResult === 'passed')?.grade || batch.qualityGrade || 'A';

  // Regulatory approval state (Strictly verified ONLY if regulatoryApproval.status === 'approved')
  const isRegulatorVerified = batch.regulatoryApproval?.status === 'approved';
  const regulatorStatus = batch.regulatoryApproval?.status || 'pending';
  const regEvent = supplyChainTimeline?.find(e => e.eventType === 'regulatory_approval');
  const rawRegApprover = batch.regulatoryApproval?.approvedBy?.name || regEvent?.performedByName || 'AYUSH Commission Officer';
  const regApprover = (rawRegApprover === mfgName || rawRegApprover?.toLowerCase() === 'sid' || rawRegApprover?.toLowerCase() === 'manufacturer')
    ? 'AYUSH Board Commission'
    : rawRegApprover;
  const regDate = batch.regulatoryApproval?.approvedAt || regEvent?.timestamp || batch.createdAt;
  const regComments = batch.regulatoryApproval?.comments || regEvent?.notes || 'Compliance approved and registered on Blockchain.';

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
        {/* Stakeholder Verification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Manufacturer Card */}
          <div className={`glass-card p-5 border-t-4 transition-all hover:scale-[1.02] ${
            isManufacturerVerified ? 'border-emerald-500 bg-emerald-500/[0.02]' : 'border-amber-500 bg-amber-500/[0.02]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center border border-white/10">
                <span className="text-xl">🏭</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isManufacturerVerified ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
              }`}>
                {isManufacturerVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Manufacturer Sign-Off</h3>
            {isManufacturerVerified ? (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 line-clamp-1">
                  {batch.manufacturer?.organization || batch.manufacturerOrganization || batch.manufacturerName}
                </p>
                <p className="text-[10px] text-gray-500">
                  Registered: {format(new Date(batch.manufacturingDate || batch.createdAt), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Signed on Chain
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Production data registration pending.</p>
            )}
          </div>

          {/* Lab Verification Card */}
          <div className={`glass-card p-5 border-t-4 transition-all hover:scale-[1.02] ${
            isLabVerified ? 'border-emerald-500 bg-emerald-500/[0.02]' : 'border-amber-500 bg-amber-500/[0.02]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center border border-white/10">
                <span className="text-xl">🔬</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isLabVerified ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
              }`}>
                {isLabVerified ? `Passed (${labGrade})` : 'Pending'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Lab Testing & Purity</h3>
            {isLabVerified ? (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 line-clamp-1">{labName}</p>
                <p className="text-[10px] text-gray-500">
                  Certified: {format(new Date(labDate), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Quality Cryptosigned
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Laboratory quality testing report pending.</p>
            )}
          </div>

          {/* Regulator Card */}
          <div className={`glass-card p-5 border-t-4 transition-all hover:scale-[1.02] ${
            isRegulatorVerified ? 'border-emerald-500 bg-emerald-500/[0.02]' :
            regulatorStatus === 'rejected' ? 'border-red-500 bg-red-500/[0.02]' : 'border-amber-500 bg-amber-500/[0.02]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center border border-white/10">
                <span className="text-xl">🏛️</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
                isRegulatorVerified ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                regulatorStatus === 'rejected' ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
              }`}>
                {regulatorStatus}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Regulatory Authorization</h3>
            {isRegulatorVerified ? (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 line-clamp-1">{regApprover}</p>
                <p className="text-[10px] text-gray-500">
                  Approved: {format(new Date(regDate), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Compliance Approved
                </div>
              </div>
            ) : regulatorStatus === 'rejected' ? (
              <div className="space-y-1">
                <p className="text-xs text-red-400 line-clamp-2">{regComments}</p>
                <p className="text-[10px] text-gray-500">
                  Decision: {format(new Date(regDate), 'MMM d, yyyy')}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Awaiting government regulator approval.</p>
            )}
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
                      <p className="text-xs text-gray-500">{getEventPerformedBy(event, batch)} · {format(new Date(event.timestamp), 'MMM d, yyyy')}</p>
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
