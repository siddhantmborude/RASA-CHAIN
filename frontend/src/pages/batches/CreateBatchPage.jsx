import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Plus, Upload, Loader2, Leaf, MapPin, Calendar, Package } from 'lucide-react';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PRODUCT_CATEGORIES = ['raw_herb', 'extract', 'powder', 'tablet', 'capsule', 'oil', 'syrup', 'other'];
const COMMON_HERBS = ['Ashwagandha', 'Turmeric', 'Brahmi', 'Neem', 'Shatavari', 'Giloy', 'Triphala', 'Amla', 'Tulsi', 'Ginger', 'Cardamom', 'Fenugreek', 'Licorice'];

export default function CreateBatchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    herbName: '', scientificName: '', description: '',
    harvestDate: '', supplierName: '', supplierOrganization: '',
    supplierContact: '', supplierLicense: '', productName: '',
    productCategory: 'raw_herb', storageConditions: '',
    expiryDate: '', manufacturingDate: '',
    harvestLocation: { address: '', city: '', state: '', country: 'India', lat: '', lng: '' },
    harvestQuantity: { value: '', unit: 'kg' },
    batchSize: { value: '', unit: 'kg' },
    certifications: [], tags: [],
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => setFiles((prev) => [...prev, ...accepted].slice(0, 5)),
    accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: 10 * 1024 * 1024,
  });

  const update = (path, value) => {
    const keys = path.split('.');
    setFormData((prev) => {
      const copy = { ...prev };
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
          form.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          form.append(key, JSON.stringify(value));
        } else {
          form.append(key, value);
        }
      });
      files.forEach((file) => form.append('documents', file));

      const { data } = await api.post('/batches', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Batch ${data.data.batchId} created and recorded on blockchain!`);
      navigate(`/batches/${data.data.batchId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Product Batch</h1>
          <p className="text-gray-400 text-sm">Every batch will be recorded on the blockchain</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Herb Details */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            Herb Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Herb Name *</label>
              <input
                list="herb-list"
                value={formData.herbName}
                onChange={(e) => update('herbName', e.target.value)}
                className="input-field"
                placeholder="e.g. Ashwagandha"
                required
              />
              <datalist id="herb-list">
                {COMMON_HERBS.map((h) => <option key={h} value={h} />)}
              </datalist>
            </div>
            <div>
              <label className="input-label">Scientific Name</label>
              <input value={formData.scientificName} onChange={(e) => update('scientificName', e.target.value)} className="input-field" placeholder="e.g. Withania somnifera" />
            </div>
            <div>
              <label className="input-label">Product Name</label>
              <input value={formData.productName} onChange={(e) => update('productName', e.target.value)} className="input-field" placeholder="e.g. Pure Ashwagandha Extract" />
            </div>
            <div>
              <label className="input-label">Product Category</label>
              <select value={formData.productCategory} onChange={(e) => update('productCategory', e.target.value)} className="input-field">
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c} style={{ background: '#111128' }}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-full">
              <label className="input-label">Description</label>
              <textarea value={formData.description} onChange={(e) => update('description', e.target.value)} className="input-field h-24 resize-none" placeholder="Describe the product batch..." />
            </div>
          </div>
        </div>

        {/* Harvest Details */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Harvest Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Harvest Date *</label>
              <input type="date" value={formData.harvestDate} onChange={(e) => update('harvestDate', e.target.value)} className="input-field" required />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="input-label">Quantity</label>
                <input type="number" value={formData.harvestQuantity.value} onChange={(e) => update('harvestQuantity.value', e.target.value)} className="input-field" placeholder="500" />
              </div>
              <div className="w-20">
                <label className="input-label">Unit</label>
                <select value={formData.harvestQuantity.unit} onChange={(e) => update('harvestQuantity.unit', e.target.value)} className="input-field">
                  {['kg', 'g', 'ton', 'lb'].map(u => <option key={u} value={u} style={{ background: '#111128' }}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Harvest Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="input-label">Address</label>
              <input value={formData.harvestLocation.address} onChange={(e) => update('harvestLocation.address', e.target.value)} className="input-field" placeholder="Village / Farm address" />
            </div>
            <div>
              <label className="input-label">City</label>
              <input value={formData.harvestLocation.city} onChange={(e) => update('harvestLocation.city', e.target.value)} className="input-field" placeholder="e.g. Rishikesh" />
            </div>
            <div>
              <label className="input-label">State</label>
              <input value={formData.harvestLocation.state} onChange={(e) => update('harvestLocation.state', e.target.value)} className="input-field" placeholder="e.g. Uttarakhand" />
            </div>
            <div>
              <label className="input-label">Latitude</label>
              <input type="number" step="any" value={formData.harvestLocation.lat} onChange={(e) => update('harvestLocation.lat', e.target.value)} className="input-field" placeholder="30.0869" />
            </div>
            <div>
              <label className="input-label">Longitude</label>
              <input type="number" step="any" value={formData.harvestLocation.lng} onChange={(e) => update('harvestLocation.lng', e.target.value)} className="input-field" placeholder="78.2676" />
            </div>
          </div>
        </div>

        {/* Supplier Info */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Supplier Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Supplier Name</label>
              <input value={formData.supplierName} onChange={(e) => update('supplierName', e.target.value)} className="input-field" placeholder="Supplier full name" />
            </div>
            <div>
              <label className="input-label">Organization</label>
              <input value={formData.supplierOrganization} onChange={(e) => update('supplierOrganization', e.target.value)} className="input-field" placeholder="Farm / Company name" />
            </div>
            <div>
              <label className="input-label">Contact</label>
              <input value={formData.supplierContact} onChange={(e) => update('supplierContact', e.target.value)} className="input-field" placeholder="Phone / Email" />
            </div>
            <div>
              <label className="input-label">License Number</label>
              <input value={formData.supplierLicense} onChange={(e) => update('supplierLicense', e.target.value)} className="input-field" placeholder="FSSAI / Farm registration" />
            </div>
          </div>
        </div>

        {/* Manufacturing */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Manufacturing Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Manufacturing Date</label>
              <input type="date" value={formData.manufacturingDate} onChange={(e) => update('manufacturingDate', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="input-label">Expiry Date</label>
              <input type="date" value={formData.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} className="input-field" />
            </div>
            <div className="col-span-full">
              <label className="input-label">Storage Conditions</label>
              <input value={formData.storageConditions} onChange={(e) => update('storageConditions', e.target.value)} className="input-field" placeholder="e.g. Cool, dry place. Temp: 15-25°C" />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            Documents & Images
          </h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.02]'}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">{isDragActive ? 'Drop files here...' : 'Drag & drop or click to upload lab reports, images, certificates'}</p>
            <p className="text-gray-600 text-xs mt-1">PDF, Images · Max 10MB · Up to 5 files</p>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm glass-card px-3 py-2">
                  <Upload className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-gray-300 flex-1 truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 flex-1 justify-center py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Recording on Blockchain...' : 'Create Batch & Record on Blockchain'}
          </button>
        </div>
      </form>
    </div>
  );
}
