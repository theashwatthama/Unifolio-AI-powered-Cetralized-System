import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/api';
import Badge from '../components/Badge';
import Layout from '../components/Layout';
import { CATEGORIES, STATUS_FILTERS } from '../utils/constants';
import { formatDate } from '../utils/formatters';

const PublicProfile = () => {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/profile/${id}`);
        setProfile(response.data);
      } catch (err) {
        setError('Unable to load public profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const getStatus = (item) => {
    if (item.verified) return 'verified';
    if (item.rejected) return 'rejected';
    return 'pending';
  };

  const filteredAchievements = useMemo(() => {
    const list = profile?.achievements || [];

    return list.filter((item) => {
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

      if (statusFilter === 'all') {
        return categoryMatch;
      }

      if (statusFilter === 'verified') {
        return categoryMatch && item.verified;
      }

      if (statusFilter === 'pending') {
        return categoryMatch && !item.verified && !item.rejected;
      }

      return categoryMatch && item.rejected;
    });
  }, [profile?.achievements, categoryFilter, statusFilter]);

  if (loading) {
    return (
      <Layout>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
          Loading profile...
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          {error || 'Profile not found'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Public Trusted Portfolio</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">{profile.user.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{profile.user.email}</p>
            </div>
            <div className="rounded-2xl border border-emerald-300 bg-white px-5 py-4 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Trust Score</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">{profile.trustScore}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Skills Auto-Generated</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.length === 0 ? (
              <p className="text-sm text-slate-500">No skills generated yet.</p>
            ) : (
              profile.skills.map((skill) => (
                <span
                  key={skill._id}
                  className="rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800"
                >
                  {skill.skillName}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Link
                to="/"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {filteredAchievements.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
              No achievements match current filters.
            </div>
          ) : (
            filteredAchievements.map((item) => (
              <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                  <Badge status={getStatus(item)} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{item.category}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(item.date)}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">Score: {item.score}</span>
                  {item.verifiedBadge && (
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-emerald-700">
                      Verified Badge
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </Layout>
  );
};

export default PublicProfile;
