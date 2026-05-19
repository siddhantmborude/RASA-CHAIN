import { useState } from 'react';
import { Cpu, Upload, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SensorPage() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [formData, setFormData] = useState({
    batchId: '', deviceId: 'E-TONGUE-001', deviceType: 'manual',
    pH: '', conductivity: '', moisture: '', temperature: '',
    tasteProfile: { sweetness: 50, bitterness: 30, sourness: 20, saltiness: 10, astringency: 40, pungency: 25 },
    adulterationScore: '', predictionConfidence: '', notes: '',
  });

  const update = (k, v) => setFormData(p => ({ ...p, [k]: v }));
  const updateTaste = (k, v) => setFormData(p => ({ ...p, tasteProfile: { ...p.tasteProfile, [k]: v } }));

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/sensor/upload', {
        ...formData,
        tasteProfile: JSON.stringify(formData.tasteProfile),
      });
      setUploadedData(data.data);
      toast.success('Sensor data uploaded & recorded on blockchain!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedData) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post('/sensor/analyze', { sessionId: uploadedData.sessionId });
      setAnalysisResult(data.analysis);
      toast.success('ML Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Sensor Integration</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">Phase 1 - Manual Entry</span>
              <span className="text-xs text-gray-500">Phase 2: Real E-Tongue Hardware</span>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Phase 1 Notice</p>
              <p className="text-xs text-gray-400 mt-0.5">
                This interface supports manual sensor data entry. Phase 2 will connect physical AI E-Tongue devices
                that automatically stream pH, conductivity, taste profile, and adulteration scores in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            Upload Sensor Data
          </h2>

          <div>
            <label className="input-label">Batch ID *</label>
            <input value={formData.batchId} onChange={(e) => update('batchId', e.target.value)} className="input-field" placeholder="RC-XXXXX-XXXXXX" required />
          </div>
          <div>
            <label className="input-label">Device ID</label>
            <input value={formData.deviceId} onChange={(e) => update('deviceId', e.target.value)} className="input-field" placeholder="E-TONGUE-001" />
          </div>

          <div className="divider" />
          <h3 className="text-sm font-semibold text-gray-300">Core Readings</h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['pH', 'pH value (0-14)', formData.pH],
              ['conductivity', 'μS/cm', formData.conductivity],
              ['moisture', '% moisture', formData.moisture],
              ['temperature', '°C', formData.temperature],
            ].map(([key, placeholder, val]) => (
              <div key={key}>
                <label className="input-label capitalize">{key}</label>
                <input type="number" step="any" value={val} onChange={(e) => update(key, e.target.value)} className="input-field py-2" placeholder={placeholder} />
              </div>
            ))}
          </div>

          <div className="divider" />
          <h3 className="text-sm font-semibold text-gray-300">Taste Profile (E-Tongue)</h3>
          <div className="space-y-2">
            {Object.entries(formData.tasteProfile).map(([taste, val]) => (
              <div key={taste} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 capitalize">{taste}</span>
                <input type="range" min={0} max={100} value={val} onChange={(e) => updateTaste(taste, Number(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-full accent-indigo-500" />
                <span className="text-xs text-indigo-400 w-8 text-right font-mono">{val}</span>
              </div>
            ))}
          </div>

          <div className="divider" />
          <h3 className="text-sm font-semibold text-gray-300">ML Pre-Analysis (optional)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Adulteration Score (0-100)</label>
              <input type="number" min={0} max={100} value={formData.adulterationScore} onChange={(e) => update('adulterationScore', e.target.value)} className="input-field py-2" placeholder="0 = pure" />
            </div>
            <div>
              <label className="input-label">Confidence %</label>
              <input type="number" min={0} max={100} value={formData.predictionConfidence} onChange={(e) => update('predictionConfidence', e.target.value)} className="input-field py-2" placeholder="85" />
            </div>
          </div>
          <div>
            <label className="input-label">Notes</label>
            <textarea value={formData.notes} onChange={(e) => update('notes', e.target.value)} className="input-field h-16 resize-none" placeholder="Additional observations..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Uploading to Blockchain...' : 'Upload Sensor Data'}
          </button>
        </form>

        {/* Analysis Panel */}
        <div className="space-y-4">
          {/* Trigger Analysis */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              ML Analysis
            </h2>
            {uploadedData ? (
              <div>
                <div className="glass-card p-3 mb-4">
                  <p className="text-xs text-gray-500">Session ID</p>
                  <p className="font-mono text-xs text-indigo-400">{uploadedData.sessionId}</p>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Recorded on blockchain: {uploadedData.blockchainTxHash?.slice(0, 20)}...
                  </p>
                </div>
                <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {analyzing ? 'Analyzing...' : 'Run ML Analysis'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Upload sensor data first to trigger analysis</p>
              </div>
            )}
          </div>

          {/* Results */}
          {analysisResult && (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Analysis Results
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border text-center font-bold text-lg ${
                  analysisResult.recommendation === 'approve' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                  analysisResult.recommendation === 'reject' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                  'bg-amber-500/20 border-amber-500/30 text-amber-400'
                }`}>
                  {analysisResult.recommendation?.toUpperCase()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Quality Score', `${analysisResult.qualityScore?.toFixed(1)}%`],
                    ['Adulteration', `${analysisResult.adulterationScore?.toFixed(1)}%`],
                    ['Confidence', `${analysisResult.predictionConfidence?.toFixed(1)}%`],
                    ['Inference', `${analysisResult.inferenceTime}ms`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white/[0.03] rounded-xl p-3">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-base font-bold text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {analysisResult.herbIdentification && (
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Herb Identification</p>
                    <p className="text-sm font-semibold text-white">{analysisResult.herbIdentification.predictedHerb}</p>
                    <p className="text-xs text-emerald-400">{analysisResult.herbIdentification.confidence}% confidence</p>
                  </div>
                )}

                <div className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Analysis Notes</p>
                  {Object.entries(analysisResult.analysis || {}).map(([k, v]) => (
                    <p key={k} className="text-xs text-gray-400">• {v}</p>
                  ))}
                </div>

                <p className="text-[10px] text-gray-600 text-center">Model: {analysisResult.modelVersion}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
