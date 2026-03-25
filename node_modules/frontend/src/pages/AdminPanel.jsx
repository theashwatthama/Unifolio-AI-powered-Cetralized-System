import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Badge from '../components/Badge';
import Layout from '../components/Layout';
import { CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FILE_BASE = API_BASE.replace(/\/api\/?$/, '');

const resolveProofUrl = (proofFileUrl) => {
  if (!proofFileUrl) {
    return '';
  }

  if (proofFileUrl.startsWith('http')) {
    return proofFileUrl;
  }

  return `${FILE_BASE}${proofFileUrl}`;
};

const STATUS_TABS = [
  { label: 'Pending Verification', value: 'pending' },
  { label: 'Approved', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
];

const AdminPanel = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewInputs, setReviewInputs] = useState({});

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/submissions');
      setSubmissions(response.data);
    } catch (err) {
      setError('Failed to load student submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const updateVerification = async (id, action) => {
    const rejectionFeedback = String(reviewInputs[id] || '').trim();

    if (action === 'reject' && !rejectionFeedback) {
      setError('Reject karne ke liye review feedback dena required hai.');
      return;
    }

    try {
      setError('');
      await api.put(`/verify/${id}`, { action, rejectionFeedback });
      setReviewInputs((prev) => ({ ...prev, [id]: '' }));
      await fetchSubmissions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  const onReviewInputChange = (id, value) => {
    setReviewInputs((prev) => ({ ...prev, [id]: value }));
  };

  const resetDetails = async () => {
    const confirmed = window.confirm(
      'This will clear all achievements and skills. Student/Admin panel details will reset to zero. Continue?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      await api.delete('/admin/reset-details');
      await fetchSubmissions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset panel details');
    }
  };

  const getStatus = (item) => {
    if (item.verified) return 'verified';
    if (item.rejected) return 'rejected';
    return 'pending';
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

      if (statusFilter === 'verified') {
        return categoryMatch && item.verified;
      }

      if (statusFilter === 'pending') {
        return categoryMatch && !item.verified && !item.rejected;
      }

      return categoryMatch && item.rejected;
    });
  }, [submissions, categoryFilter, statusFilter]);

  return (
    <Layout>
      <section className="dashboard-shell space-y-6">
        <div className="admin-hero rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Admin Verification Panel</h2>
          <p className="mt-2 text-sm text-slate-600">Review, approve, or reject submitted achievements.</p>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'border border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={fetchSubmissions}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Refresh Submissions
              </button>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetDetails}
                className="w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
              >
                Reset Details To 0
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
            Loading submissions...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
            No submissions available for current filters.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((item) => (
              <article key={item._id} className="surface-card rounded-2xl p-5">
                {(() => {
                  const proofUrl = resolveProofUrl(item.proofFileUrl);
                  const isImageProof = (item.proofFileType || '').startsWith('image/');

                  return (
                    <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {item.userId?.name} • {item.userId?.email}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-1">{item.category}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(item.date)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Score: {item.score}</span>
                      {item.hasProof && <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-700">Proof</span>}
                      {item.suspiciousProof && (
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-amber-800">
                          Potential Fake Proof
                        </span>
                      )}
                    </div>

                    {item.suspiciousProof && item.suspiciousProofReason && (
                      <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Detector: {item.suspiciousProofReason}
                      </p>
                    )}

                    {proofUrl && (
                      <div className="achievement-card mt-3 rounded-xl p-3">
                        <p className="text-xs font-semibold text-slate-700">Uploaded Proof</p>
                        {isImageProof ? (
                          <a href={proofUrl} target="_blank" rel="noreferrer">
                            <img
                              src={proofUrl}
                              alt={item.proofFileName || 'Proof image'}
                              className="mt-2 h-28 w-40 rounded-lg border border-slate-200 object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                          >
                            View Certificate PDF
                          </a>
                        )}
                      </div>
                    )}

                    {item.rejected && item.rejectionFeedback && (
                      <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        <span className="font-semibold">Admin Review:</span> {item.rejectionFeedback}
                      </p>
                    )}

                    {!item.verified && !item.rejected && (
                      <div className="achievement-card mt-3 rounded-xl p-3">
                        <label htmlFor={`review-${item._id}`} className="mb-2 block text-xs font-semibold text-slate-700">
                          Rejection Review (what is missing / what to add)
                        </label>
                        <textarea
                          id={`review-${item._id}`}
                          value={reviewInputs[item._id] || ''}
                          onChange={(event) => onReviewInputChange(item._id, event.target.value)}
                          rows={3}
                          placeholder="Example: Certificate unclear hai, event date aur organizer stamp add karo."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-rose-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-[230px] flex-col items-start gap-3 lg:items-end">
                    <Badge status={getStatus(item)} />
                      {item.userId?._id && (
                        <Link
                          to={`/profile/${item.userId._id}`}
                          className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                        >
                          View Profile
                        </Link>
                      )}
                      {!item.verified && !item.rejected ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateVerification(item._id, 'approve')}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                          >
                            Approve + Badge
                          </button>
                          <button
                            type="button"
                            onClick={() => updateVerification(item._id, 'reject')}
                            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                          >
                            Reject With Review
                          </button>
                        </div>
                      ) : (
                        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                          Final status set: {item.verified ? 'Approved' : 'Rejected'}
                        </p>
                      )}
                  </div>
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default AdminPanel;
