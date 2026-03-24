import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../utils/constants';

const AddAchievementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathon',
    description: '',
    date: '',
  });
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setProofFile(file);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('userId', user._id);
      payload.append('title', formData.title);
      payload.append('category', formData.category);
      payload.append('description', formData.description);
      payload.append('date', formData.date);

      if (proofFile) {
        payload.append('proofFile', proofFile);
        payload.append('hasProof', 'true');
      } else {
        payload.append('hasProof', 'false');
      }

      await api.post('/add-achievement', payload);
      setMessage('Achievement added successfully. It is now pending admin verification.');
      setFormData({
        title: '',
        category: 'Hackathon',
        description: '',
        date: '',
      });
      setProofFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add achievement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add Achievement</h2>
            <p className="text-sm text-slate-500">Submit new record for verification.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              placeholder="Example: National Hackathon Top 10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
            <select
              required
              name="category"
              value={formData.category}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              placeholder="Briefly describe your achievement and impact"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
            <input
              required
              type="date"
              name="date"
              value={formData.date}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Upload Certificate/Image (Optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={onFileChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">Accepted: JPG, PNG, WEBP, PDF (max 5MB)</p>
            {proofFile && <p className="mt-1 text-xs font-medium text-cyan-700">Selected: {proofFile.name}</p>}
          </div>

          {message && (
            <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-700">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit Achievement'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AddAchievementPage;
