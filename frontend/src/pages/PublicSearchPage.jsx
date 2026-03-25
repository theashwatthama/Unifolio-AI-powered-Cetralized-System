import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Layout from '../components/Layout';

const PublicSearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('name');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const latestSuggestionRequest = useRef(0);

  const searchWithLegacyApiFallback = async (searchQuery, filterType) => {
    const usersResponse = await api.get('/users');
    const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
    const needle = searchQuery.toLowerCase();

    const students = users.filter((user) => user.role === 'Student').slice(0, 60);

    const detailedProfiles = await Promise.all(
      students.map(async (user) => {
        try {
          const profileResponse = await api.get(`/profile/${user._id}`);
          const profile = profileResponse.data || {};
          const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
          const skillNames = Array.isArray(profile.skills) ? profile.skills.map((item) => item.skillName) : [];

          return {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            trustScore: profile.trustScore || 0,
            totalAchievements: achievements.length,
            verifiedCount: achievements.filter((item) => item.verified).length,
            pendingCount: 0,
            skills: skillNames,
            matchedSkills: skillNames.filter((item) => String(item).toLowerCase().includes(needle)),
          };
        } catch (error) {
          return {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            trustScore: 0,
            totalAchievements: 0,
            verifiedCount: 0,
            pendingCount: 0,
            skills: [],
            matchedSkills: [],
          };
        }
      })
    );

    const filteredProfiles = detailedProfiles.filter((item) => {
      if (filterType === 'skill') {
        return item.matchedSkills.length > 0;
      }

      return String(item.name || '').toLowerCase().includes(needle);
    });

    return filteredProfiles
      .sort((left, right) => right.trustScore - left.trustScore)
      .slice(0, 20);
  };

  const fetchSearchResults = async (searchQuery, filterType) => {
    const response = await api.get('/public/search', {
      params: filterType === 'skill' ? { skill: searchQuery } : { name: searchQuery },
    });

    return response.data?.results || [];
  };

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const requestId = latestSuggestionRequest.current + 1;
    latestSuggestionRequest.current = requestId;

    const timeout = setTimeout(async () => {
      setSuggestionsLoading(true);

      try {
        const nextSuggestions = await fetchSearchResults(trimmed, searchFilter);
        if (latestSuggestionRequest.current === requestId) {
          setSuggestions(nextSuggestions.slice(0, 6));
        }
      } catch (err) {
        try {
          const fallbackSuggestions = await searchWithLegacyApiFallback(trimmed, searchFilter);
          if (latestSuggestionRequest.current === requestId) {
            setSuggestions(fallbackSuggestions.slice(0, 6));
          }
        } catch (fallbackError) {
          if (latestSuggestionRequest.current === requestId) {
            setSuggestions([]);
          }
        }
      } finally {
        if (latestSuggestionRequest.current === requestId) {
          setSuggestionsLoading(false);
        }
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [query, searchFilter]);

  const onSelectSuggestion = (item) => {
    if (searchFilter === 'skill' && item.matchedSkills?.length) {
      setQuery(item.matchedSkills[0]);
    } else {
      setQuery(item.name || '');
    }

    setSuggestions([]);
    setResults([item]);
    setSearched(true);
    setError('');
  };

  const onSearch = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError(searchFilter === 'skill' ? 'Please enter a skill to search' : 'Please enter full name to search');
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const nextResults = await fetchSearchResults(trimmed, searchFilter);
      setResults(nextResults);
      setSearched(true);
    } catch (err) {
      try {
        const fallbackResults = await searchWithLegacyApiFallback(trimmed, searchFilter);
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
            Recruiter full name ya skill (Java, MERN, React, Node) se students search kar sakta hai.
          </p>

          <form onSubmit={onSearch} className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <select
              value={searchFilter}
              onChange={(event) => {
                setSearchFilter(event.target.value);
                setQuery('');
                setSuggestions([]);
                setResults([]);
                setSearched(false);
                setError('');
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value="name">Search By: Full Name</option>
              <option value="skill">Search By: Skill</option>
            </select>

            <div className="relative">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  searchFilter === 'skill'
                    ? 'Enter skill (e.g. Java, MERN Stack, React)'
                    : 'Enter full name (e.g. Aarav Sharma)'
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none"
              />

              {query.trim() && (suggestionsLoading || suggestions.length > 0) && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {suggestionsLoading ? (
                    <p className="px-3 py-2 text-xs text-slate-500">Searching profiles...</p>
                  ) : (
                    suggestions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => onSelectSuggestion(item)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-cyan-50"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{item.name}</span>
                          <span className="block text-xs text-slate-500">@{item.username || 'student'}</span>
                        </span>
                        <span className="rounded-full border border-cyan-300 bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-700">
                          Select
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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
              {searchFilter === 'skill' ? 'No students found for this skill.' : 'No public profiles found for this name.'}
            </div>
          ) : (
            results.map((item) => (
              <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">@{item.username || 'student'}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1">Trust Score: {item.trustScore}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Achievements: {item.totalAchievements}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Verified: {item.verifiedCount}</span>
                      {searchFilter === 'skill' && item.matchedSkills?.length > 0 && (
                        <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-700">
                          Skill Match: {item.matchedSkills.join(', ')}
                        </span>
                      )}
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
