import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Layout from '../components/Layout';

const PublicSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const searchWithLegacyApiFallback = async (nameQuery) => {
    const usersResponse = await api.get('/users');
    const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
    const needle = nameQuery.toLowerCase();

    const matchedStudents = users
      .filter((user) => user.role === 'Student' && String(user.name || '').toLowerCase().includes(needle))
      .slice(0, 20);

    const detailedProfiles = await Promise.all(
      matchedStudents.map(async (user) => {
        try {
          const profileResponse = await api.get(`/profile/${user._id}`);
          const profile = profileResponse.data || {};
          const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            trustScore: profile.trustScore || 0,
            totalAchievements: achievements.length,
            verifiedCount: achievements.filter((item) => item.verified).length,
            pendingCount: achievements.filter((item) => !item.verified && !item.rejected).length,
          };
        } catch (error) {
          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            trustScore: 0,
            totalAchievements: 0,
            verifiedCount: 0,
            pendingCount: 0,
          };
        }
      })
    );

    return detailedProfiles;
  };

  const onSearch = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError('Please enter full name to search');
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/public/search', {
        params: { name: trimmed },
      });

      setResults(response.data?.results || []);
      setSearched(true);
    } catch (err) {
      try {
        const fallbackResults = await searchWithLegacyApiFallback(trimmed);
        setResults(fallbackResults);
        setSearched(true);
      } catch (fallbackError) {
        setError(fallbackError.response?.data?.message || 'Failed to search profiles');
        setResults([]);
        setSearched(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Public Profile Search</h2>
          <p className="mt-2 text-sm text-slate-600">
            Full name enter karke kisi bhi student ka trusted public portfolio dekh sakte ho.
          </p>

          <form onSubmit={onSearch} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter full name (e.g. Aarav Sharma)"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </section>

        <section className="space-y-4">
          {searched && !loading && results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              No public profiles found for this name.
            </div>
          ) : (
            results.map((item) => (
              <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1">Trust Score: {item.trustScore}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Achievements: {item.totalAchievements}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Verified: {item.verifiedCount}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Pending: {item.pendingCount}</span>
                    </div>
                  </div>

                  <Link
                    to={`/profile/${item._id}`}
                    className="inline-flex rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
                  >
                    View Full Profile
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <Link to="/" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Back to Login
          </Link>
        </section>
      </div>
    </Layout>
  );
};

export default PublicSearchPage;
