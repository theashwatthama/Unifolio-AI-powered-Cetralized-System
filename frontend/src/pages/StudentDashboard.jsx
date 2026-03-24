import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Badge from '../components/Badge';
import CategoryChart from '../components/CategoryChart';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, STATUS_FILTERS } from '../utils/constants';
import { formatDate } from '../utils/formatters';

const StudentDashboard = () => {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    if (!user?._id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [dashboardRes, achievementsRes] = await Promise.all([
        api.get(`/dashboard/${user._id}`),
        api.get(`/achievements/${user._id}`),
      ]);

      setDashboard(dashboardRes.data);
      setAchievements(achievementsRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?._id]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
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
  }, [achievements, categoryFilter, statusFilter]);

  const getStatus = (item) => {
    if (item.verified) return 'verified';
    if (item.rejected) return 'rejected';
    return 'pending';
  };

  if (loading) {
    return (
      <Layout>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-900 via-slate-900 to-emerald-900 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Student Dashboard</p>
              <h2 className="mt-2 text-3xl font-black">Welcome, {user?.name}</h2>
              <p className="mt-2 text-sm text-slate-200">Track verification progress and showcase your trusted profile.</p>
            </div>
            <Link
              to="/add-achievement"
              className="inline-flex h-fit items-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              + Add New Achievement
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Achievements" value={dashboard?.total || 0} />
          <StatCard title="Verified" value={dashboard?.verified || 0} accent="text-emerald-700" />
          <StatCard title="Pending" value={dashboard?.pending || 0} accent="text-red-700" />
          <StatCard
            title="Trust Score"
            value={dashboard?.trustScore || 0}
            accent="text-cyan-700"
            helper="Verified +50 | Internship +30 | Hackathon +20 | Proof +20"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <CategoryChart breakdown={dashboard?.categoryBreakdown || []} />
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
            <p className="mt-1 text-sm text-slate-500">Refine your timeline by category and status.</p>

            <div className="mt-5 space-y-4">
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

              <Link
                to={`/profile/${user?._id}`}
                className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                View Public Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Achievement Timeline</h3>
            <button
              type="button"
              onClick={fetchData}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          {filteredAchievements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No achievements match current filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAchievements.map((item) => (
                <article key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    </div>
                    <Badge status={getStatus(item)} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="rounded-full bg-slate-200 px-2 py-1">{item.category}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-1">{formatDate(item.date)}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-1">Score: {item.score}</span>
                    {item.hasProof && <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-700">Proof Added</span>}
                    {item.verifiedBadge && (
                      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-emerald-700">
                        Verified Badge
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
