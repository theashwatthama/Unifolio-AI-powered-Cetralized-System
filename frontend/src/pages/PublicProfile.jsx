import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/api';
import Badge from '../components/Badge';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
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

const getSkillApiErrorMessage = (requestError, fallbackMessage) => {
  const responseData = requestError?.response?.data;

  if (responseData && typeof responseData === 'object' && responseData.message) {
    return responseData.message;
  }

  if (typeof responseData === 'string') {
    if (responseData.includes('Cannot POST /api/profile/') || responseData.includes('Cannot DELETE /api/profile/')) {
      return 'Skill API not available yet. Please restart backend server and try again.';
    }
  }

  return fallbackMessage;
};

const PublicProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [skillInput, setSkillInput] = useState('');
  const [skillRequestLoading, setSkillRequestLoading] = useState(false);
  const [skillError, setSkillError] = useState('');

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
    const list = (profile?.achievements || []).filter((item) => item.verified);

    return list.filter((item) => {
      return categoryFilter === 'all' || item.category === categoryFilter;
    });
  }, [profile?.achievements, categoryFilter]);

  const isOwnStudentProfile = user?._id === profile?.user?._id && user?.role === 'Student';

  const onAddSkill = async (event) => {
    event.preventDefault();
    const skillName = skillInput.trim();

    if (!skillName || !profile?.user?._id) {
      return;
    }

    setSkillRequestLoading(true);
    setSkillError('');

    try {
      const response = await api.post(`/profile/${profile.user._id}/skills`, { skillName });
      setProfile((prev) => ({
        ...prev,
        skills: response.data?.skills || prev.skills || [],
      }));
      setSkillInput('');
    } catch (requestError) {
      setSkillError(getSkillApiErrorMessage(requestError, 'Failed to add skill'));
    } finally {
      setSkillRequestLoading(false);
    }
  };

  const onRemoveSkill = async (skillId) => {
    if (!profile?.user?._id) {
      return;
    }

    setSkillRequestLoading(true);
    setSkillError('');

    try {
      const response = await api.delete(`/profile/${profile.user._id}/skills/${skillId}`);
      setProfile((prev) => ({
        ...prev,
        skills: response.data?.skills || prev.skills || [],
      }));
    } catch (requestError) {
      setSkillError(getSkillApiErrorMessage(requestError, 'Failed to remove skill'));
    } finally {
      setSkillRequestLoading(false);
    }
  };

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
      <div className="dashboard-shell space-y-6">
        <section className="public-hero rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Public Trusted Portfolio</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">{profile.user.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{profile.user.email}</p>
            </div>
            <div className="surface-card rounded-2xl px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Trust Score</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">{profile.trustScore}</p>
            </div>
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Student Details</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="achievement-card rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Full Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{profile.user.name}</p>
                </div>
                <div className="achievement-card rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Username</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">@{profile.user.username || 'student'}</p>
                </div>
                <div className="achievement-card rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email ID</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{profile.user.email}</p>
                </div>
              </div>

              <div className="mt-4">
                {isOwnStudentProfile && (
                  <form onSubmit={onAddSkill} className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={skillInput}
                      onChange={(event) => setSkillInput(event.target.value)}
                      maxLength={50}
                      placeholder="Add your skill (e.g. Data Analysis)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={skillRequestLoading || !skillInput.trim()}
                      className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {skillRequestLoading ? 'Saving...' : 'Add Skill'}
                    </button>
                  </form>
                )}
                {skillError && <p className="mt-2 text-xs text-rose-600">{skillError}</p>}
                <div className="achievement-card mt-2 rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Skills</p>
                  {profile.skills.length === 0 ? (
                    <p className="mt-1 text-sm text-slate-500">No skills added yet.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <div
                          key={skill._id}
                          className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800"
                        >
                          {skill.skillName}
                          {isOwnStudentProfile && (
                            <button
                              type="button"
                              onClick={() => onRemoveSkill(skill._id)}
                              className="rounded-full px-1 text-cyan-700 transition hover:bg-cyan-200"
                              aria-label={`Remove ${skill.skillName}`}
                            >
                              x
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <a
              href="#my-achievements"
              className="inline-flex rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              My Achievements
            </a>
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Link
                to="/"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </section>

        <section id="my-achievements" className="space-y-4">
          {filteredAchievements.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
              No achievements match current filters.
            </div>
          ) : (
            filteredAchievements.map((item) => (
              <article key={item._id} className="surface-card rounded-2xl p-5">
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

                {(() => {
                  const proofUrl = resolveProofUrl(item.proofFileUrl);
                  const isImageProof = (item.proofFileType || '').startsWith('image/');

                  if (!proofUrl) {
                    if (item.hasProof) {
                      return (
                        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          Certificate was submitted but preview file is not available.
                        </p>
                      );
                    }

                    return null;
                  }

                  return (
                    <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                      <p className="text-xs font-semibold text-cyan-800">Certificate Proof</p>
                      {isImageProof ? (
                        <a href={proofUrl} target="_blank" rel="noreferrer">
                          <img
                            src={proofUrl}
                            alt={item.proofFileName || `${item.title} certificate`}
                            className="mt-2 h-28 w-40 rounded-lg border border-cyan-200 object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                        >
                          View Certificate PDF
                        </a>
                      )}
                    </div>
                  );
                })()}
              </article>
            ))
          )}
        </section>
      </div>
    </Layout>
  );
};

export default PublicProfile;
