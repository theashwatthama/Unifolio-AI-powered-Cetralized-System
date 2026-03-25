import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import api from '../api/api';
import Badge from '../components/Badge';
import CategoryChart from '../components/CategoryChart';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, STATUS_FILTERS } from '../utils/constants';
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

const RESUME_TEMPLATES = [
  { label: 'General Resume', value: 'general' },
  { label: 'Java Developer', value: 'java' },
  { label: 'MERN Stack Developer', value: 'mern' },
  { label: 'Data Analyst / Data Science', value: 'data' },
];

const AI_PROVIDERS = [
  { label: 'Groq', value: 'groq' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Gemini', value: 'gemini' },
];

const toAchievementLine = (item) => {
  const status = item.verified ? 'Verified' : item.rejected ? 'Rejected' : 'Pending';
  const proof = item.hasProof ? 'Proof Attached' : 'No Proof';
  return `${item.title} (${item.category}) | ${status} | ${formatDate(item.date)} | ${proof}`;
};

const composeResumeText = ({ name, email, summary, skills, achievements, highlights, trustScore, role }) => {
  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const safeHighlights = Array.isArray(highlights) ? highlights : [];

  return [
    `${(name || 'Student').toUpperCase()}`,
    `${email || ''}`,
    '',
    'PROFESSIONAL SUMMARY',
    summary || 'Add a short summary about your strengths and target role.',
    '',
    'KEY SKILLS',
    ...(safeSkills.length > 0 ? safeSkills.map((item) => `- ${item}`) : ['- Add relevant skills']),
    '',
    'ACHIEVEMENTS',
    ...(safeAchievements.length > 0 ? safeAchievements.map((item) => `- ${item}`) : ['- Add notable achievements']),
    '',
    'EXTRA HIGHLIGHTS',
    ...(safeHighlights.length > 0 ? safeHighlights.map((item) => `- ${item}`) : ['- Add internships, projects, or leadership points']),
    '',
    'PROFILE INSIGHT',
    `- Role: ${role || 'Student'}`,
    `- Trust Score: ${trustScore || 0}`,
    '- Portfolio Type: Centralized Academic + Extracurricular Record',
  ].join('\n');
};

const buildResumeEditorDraft = ({ user, skills, achievements, trustScore, summary }) => {
  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeAchievements = Array.isArray(achievements) ? achievements : [];

  const skillNames = safeSkills
    .map((item) => (typeof item === 'string' ? item : item.skillName || ''))
    .map((item) => String(item).trim())
    .filter(Boolean);

  const achievementLines = safeAchievements.slice(0, 8).map((item) => toAchievementLine(item));

  return {
    name: user?.name || 'Student',
    email: user?.email || '',
    role: user?.role || 'Student',
    trustScore: trustScore || 0,
    summary:
      summary ||
      `${user?.name || 'Student'} is an achievement-driven student building a trusted portfolio with verified records.`,
    skills: skillNames.length > 0 ? skillNames : ['Problem Solving', 'Technical Learning'],
    achievements: achievementLines,
    highlights: ['Open to internships and full-time opportunities'],
  };
};

const parseAiResumeToEditor = ({ resumeText, fallbackEditor }) => {
  const lines = String(resumeText || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  const getSection = (labels) => {
    const labelSet = labels.map((item) => item.toUpperCase());
    const index = lines.findIndex((item) => labelSet.includes(item.toUpperCase()));
    if (index === -1) {
      return [];
    }

    const section = [];
    for (let i = index + 1; i < lines.length; i += 1) {
      const isHeader = /^[A-Z][A-Z\s/&-]{3,}$/.test(lines[i]);
      if (isHeader) {
        break;
      }
      section.push(lines[i]);
    }

    return section;
  };

  const summaryLines = getSection(['PROFESSIONAL SUMMARY']);
  const skillLines = getSection(['KEY SKILLS']);
  const achievementLines = getSection(['PROJECTS / ACHIEVEMENTS', 'ACHIEVEMENTS']);
  const highlightLines = getSection(['EXTRA HIGHLIGHTS']);

  const cleanedSkills = skillLines
    .map((item) => item.replace(/^-\s*/, '').trim())
    .filter(Boolean);

  const cleanedAchievements = achievementLines
    .map((item) => item.replace(/^-\s*/, '').trim())
    .filter(Boolean);

  const cleanedHighlights = highlightLines
    .map((item) => item.replace(/^-\s*/, '').trim())
    .filter(Boolean);

  return {
    ...fallbackEditor,
    summary: summaryLines.join(' ') || fallbackEditor.summary,
    skills: cleanedSkills.length > 0 ? cleanedSkills : fallbackEditor.skills,
    achievements: cleanedAchievements.length > 0 ? cleanedAchievements : fallbackEditor.achievements,
    highlights: cleanedHighlights.length > 0 ? cleanedHighlights : fallbackEditor.highlights,
  };
};

const isResumeHeading = (line) => /^[A-Z][A-Z\s/&-]{3,}$/.test(String(line || '').trim());

const buildLocalResumeDraft = ({ user, achievements, trustScore }) => {
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const verified = safeAchievements.filter((item) => item.verified).length;
  const pending = safeAchievements.filter((item) => !item.verified && !item.rejected).length;

  const summary = [
    `${user?.name || 'Student'} is an achievement-driven student with ${verified} verified accomplishment(s).`,
    `Current trust score: ${trustScore || 0}.`,
    `Total achievements: ${safeAchievements.length}, Verified: ${verified}, Pending: ${pending}.`,
  ].join(' ');

  const achievementsBlock = safeAchievements
    .slice(0, 10)
    .map((item) => {
      const status = item.verified ? 'Verified' : item.rejected ? 'Rejected' : 'Pending';
      const proof = item.hasProof ? 'Proof Attached' : 'No Proof';
      return `- ${item.title} (${item.category}) | ${status} | ${formatDate(item.date)} | ${proof}`;
    })
    .join('\n');

  const resumeText = [
    `${(user?.name || 'Student').toUpperCase()}`,
    `${user?.email || ''}`,
    '',
    'PROFESSIONAL SUMMARY',
    summary,
    '',
    'KEY SKILLS',
    '- Problem Solving, Technical Learning, Collaboration',
    '',
    'ACHIEVEMENTS',
    achievementsBlock || '- No achievements submitted yet.',
    '',
    'PROFILE INSIGHT',
    `- Role: ${user?.role || 'Student'}`,
    `- Trust Score: ${trustScore || 0}`,
    '- Portfolio Type: Centralized Academic + Extracurricular Record',
  ].join('\n');

  return {
    summary,
    resumeText,
    editor: buildResumeEditorDraft({
      user,
      skills: [],
      achievements: safeAchievements,
      trustScore: trustScore || 0,
      summary,
    }),
  };
};

const StudentDashboard = () => {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resumeText, setResumeText] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');
  const [resumeMessageTone, setResumeMessageTone] = useState('info');
  const [resumeEditor, setResumeEditor] = useState(null);
  const [skillDraft, setSkillDraft] = useState('');
  const [achievementDraft, setAchievementDraft] = useState('');
  const [highlightDraft, setHighlightDraft] = useState('');
  const [resumeTemplate, setResumeTemplate] = useState('general');
  const [resumeProvider, setResumeProvider] = useState('groq');
  const [targetRole, setTargetRole] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [resumeMeta, setResumeMeta] = useState({ provider: '', model: '' });

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

  const resumePreviewLines = useMemo(() => String(resumeText || '').split('\n'), [resumeText]);

  const getStatus = (item) => {
    if (item.verified) return 'verified';
    if (item.rejected) return 'rejected';
    return 'pending';
  };

  const generateResume = async () => {
    if (!user?._id) {
      return;
    }

    setResumeLoading(true);
    setResumeMessage('');
    setResumeMessageTone('info');

    try {
      const response = await api.post(`/resume-ai/${user._id}`, {
        provider: resumeProvider,
        template: resumeTemplate,
        targetRole,
        extraNotes,
      });

      const aiResumeText = response.data?.resume?.resumeText || '';
      const fallbackEditor = buildResumeEditorDraft({
        user: response.data?.user || user,
        skills: response.data?.skills || [],
        achievements: response.data?.achievements || achievements,
        trustScore: response.data?.trustScore || dashboard?.trustScore || 0,
        summary: '',
      });

      const nextEditor = parseAiResumeToEditor({
        resumeText: aiResumeText,
        fallbackEditor,
      });

      setResumeMeta({
        provider: response.data?.resume?.provider || resumeProvider,
        model: response.data?.resume?.model || '',
      });

      if (aiResumeText) {
        setResumeEditor(nextEditor);
        setResumeSummary(nextEditor.summary);
        setResumeText(composeResumeText(nextEditor));
        if (response.data?.resume?.fallback) {
          setResumeMessage('AI provider unavailable/quota limit reached. Local enhanced resume draft generated successfully.');
          setResumeMessageTone('warning');
        } else {
          setResumeMessage('AI resume generated and converted into editable sections successfully.');
          setResumeMessageTone('success');
        }
        return;
      }

      const localDraft = buildLocalResumeDraft({
        user,
        achievements,
        trustScore: dashboard?.trustScore || 0,
      });
      setResumeEditor(localDraft.editor);
      setResumeText(composeResumeText(localDraft.editor));
      setResumeSummary(localDraft.summary);
      setResumeMeta({ provider: 'fallback', model: 'local-draft' });
      setResumeMessage('Resume generated using local fallback draft.');
      setResumeMessageTone('warning');
    } catch (err) {
      const localDraft = buildLocalResumeDraft({
        user,
        achievements,
        trustScore: dashboard?.trustScore || 0,
      });
      setResumeEditor(localDraft.editor);
      setResumeText(composeResumeText(localDraft.editor));
      setResumeSummary(localDraft.summary);
      setResumeMeta({ provider: 'fallback', model: 'local-draft' });
      setResumeMessage(
        `${err.response?.data?.error || err.response?.data?.message || 'AI resume service unavailable'}. Local fallback resume generated.`
      );
      setResumeMessageTone('warning');
    } finally {
      setResumeLoading(false);
    }
  };

  const addResumeSkill = () => {
    const value = skillDraft.trim();
    if (!value || !resumeEditor) {
      return;
    }

    const exists = resumeEditor.skills.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      setResumeMessage('Skill already exists in resume.');
      setResumeMessageTone('warning');
      return;
    }

    setResumeEditor((prev) => ({ ...prev, skills: [...prev.skills, value] }));
    setSkillDraft('');
  };

  const removeResumeSkill = (skillName) => {
    if (!resumeEditor) {
      return;
    }

    setResumeEditor((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skillName),
    }));
  };

  const addAchievementPoint = () => {
    const value = achievementDraft.trim();
    if (!value || !resumeEditor) {
      return;
    }

    setResumeEditor((prev) => ({ ...prev, achievements: [...prev.achievements, value] }));
    setAchievementDraft('');
  };

  const removeAchievementPoint = (index) => {
    if (!resumeEditor) {
      return;
    }

    setResumeEditor((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, idx) => idx !== index),
    }));
  };

  const addHighlightPoint = () => {
    const value = highlightDraft.trim();
    if (!value || !resumeEditor) {
      return;
    }

    setResumeEditor((prev) => ({ ...prev, highlights: [...prev.highlights, value] }));
    setHighlightDraft('');
  };

  const removeHighlightPoint = (index) => {
    if (!resumeEditor) {
      return;
    }

    setResumeEditor((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, idx) => idx !== index),
    }));
  };

  useEffect(() => {
    if (!resumeEditor) {
      return;
    }

    setResumeSummary(resumeEditor.summary || '');
    setResumeText(composeResumeText(resumeEditor));
  }, [resumeEditor]);

  const copyResume = async () => {
    if (!resumeText) {
      setResumeMessage('Generate resume first.');
      setResumeMessageTone('warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(resumeText);
      setResumeMessage('Resume copied to clipboard.');
      setResumeMessageTone('success');
    } catch (error) {
      setResumeMessage('Unable to copy resume. Please copy manually.');
      setResumeMessageTone('error');
    }
  };

  const downloadResume = () => {
    if (!resumeText) {
      setResumeMessage('Generate resume first.');
      setResumeMessageTone('warning');
      return;
    }

    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(user?.name || 'student').replace(/\s+/g, '_')}_resume.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    setResumeMessage('Resume file downloaded.');
    setResumeMessageTone('success');
  };

  const downloadResumePdf = () => {
    if (!resumeText) {
      setResumeMessage('Generate resume first.');
      setResumeMessageTone('warning');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const contentWidth = pageWidth - margin * 2;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 92, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`${user?.name || 'Student'} Resume`, margin, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Template: ${resumeTemplate.toUpperCase()} | Generated via ${resumeMeta.provider || resumeProvider}`, margin, 64);

    doc.setTextColor(30, 41, 59);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(resumeText, contentWidth);
    let y = 120;

    lines.forEach((line) => {
      if (y > pageHeight - 48) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, margin, y);
      y += 16;
    });

    doc.save(`${(user?.name || 'student').replace(/\s+/g, '_')}_resume.pdf`);
    setResumeMessage('Styled PDF resume downloaded.');
    setResumeMessageTone('success');
  };

  const resumeMessageClass =
    resumeMessageTone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : resumeMessageTone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : resumeMessageTone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-cyan-200 bg-cyan-50 text-cyan-700';

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
      <div className="dashboard-shell space-y-6">
        <section className="dashboard-hero rounded-2xl p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">Student Dashboard</p>
              <h2 className="mt-2 text-3xl font-black">Welcome, {user?.name}</h2>
              <p className="mt-2 text-sm text-slate-200">Track verification progress and showcase your trusted profile.</p>
            </div>
            <Link
              to="/add-achievement"
              className="dashboard-primary-btn inline-flex h-fit items-center rounded-xl px-4 py-3 text-sm font-semibold"
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

          <div className="surface-card xl:col-span-2 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
            <p className="mt-1 text-sm text-slate-500">Refine your timeline by category and status.</p>

            <div className="mt-5 space-y-4">
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
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
                className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                View Public Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Achievement Timeline</h3>
            <button
              type="button"
              onClick={fetchData}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100"
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
                <article key={item._id} className="achievement-card rounded-xl p-4">
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

                  {item.rejected && item.rejectionFeedback && (
                    <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <span className="font-semibold">Admin Review:</span> {item.rejectionFeedback}
                    </p>
                  )}

                  {(() => {
                    const proofUrl = resolveProofUrl(item.proofFileUrl);
                    const isImageProof = (item.proofFileType || '').startsWith('image/');

                    if (!proofUrl) {
                      if (item.hasProof) {
                        return (
                          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Certificate marked as proof, but file is not available for preview. Please re-upload this achievement certificate.
                          </p>
                        );
                      }

                      return null;
                    }

                    return (
                      <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                        <p className="text-xs font-semibold text-cyan-800">Your Certificate</p>

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
              ))}
            </div>
          )}
        </section>

        <section className="surface-card rounded-2xl p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">AI Resume Builder</h3>
              <p className="mt-1 text-sm text-slate-500">
                Generates a ready-to-use resume draft using your achievements, certificates, and skills.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generateResume}
                disabled={resumeLoading}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resumeLoading ? 'Generating...' : 'Generate AI Resume'}
              </button>
              <button
                type="button"
                onClick={copyResume}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={downloadResume}
                className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100"
              >
                Download TXT
              </button>
              <button
                type="button"
                onClick={downloadResumePdf}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                Download PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">AI Provider</label>
              <select
                value={resumeProvider}
                onChange={(event) => setResumeProvider(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {AI_PROVIDERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">Recruiter Template</label>
              <select
                value={resumeTemplate}
                onChange={(event) => setResumeTemplate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {RESUME_TEMPLATES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">Target Role</label>
              <input
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="Example: Java Backend Developer Intern"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">Custom Notes For AI</label>
              <textarea
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
                rows={2}
                placeholder="Mention projects, preferred companies, leadership points, or anything AI should include."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </div>

          {resumeMeta.provider && (
            <p className="mt-3 text-xs font-medium text-slate-500">
              Last generated using: {resumeMeta.provider.toUpperCase()} {resumeMeta.model ? `(${resumeMeta.model})` : ''}
            </p>
          )}

          {resumeMessage && (
            <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${resumeMessageClass}`}>{resumeMessage}</p>
          )}

          {resumeSummary && (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{resumeSummary}</p>
          )}

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">Professional Summary</label>
                <textarea
                  value={resumeEditor?.summary || ''}
                  onChange={(event) => setResumeEditor((prev) => (prev ? { ...prev, summary: event.target.value } : prev))}
                  rows={4}
                  placeholder="Write a concise summary for recruiters"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">Skills (add/delete)</label>
                <div className="flex gap-2">
                  <input
                    value={skillDraft}
                    onChange={(event) => setSkillDraft(event.target.value)}
                    placeholder="Add skill (e.g. MERN Stack)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={addResumeSkill}
                    className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(resumeEditor?.skills || []).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => removeResumeSkill(item)}
                      className="rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800"
                    >
                      {item} x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">Achievements (add/delete)</label>
                <div className="flex gap-2">
                  <input
                    value={achievementDraft}
                    onChange={(event) => setAchievementDraft(event.target.value)}
                    placeholder="Add resume achievement bullet"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={addAchievementPoint}
                    className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {(resumeEditor?.achievements || []).map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-2 py-1">
                      <span className="text-xs leading-relaxed">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeAchievementPoint(index)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">Extra Highlights (add/delete)</label>
                <div className="flex gap-2">
                  <input
                    value={highlightDraft}
                    onChange={(event) => setHighlightDraft(event.target.value)}
                    placeholder="Add project, internship, leadership point"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={addHighlightPoint}
                    className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {(resumeEditor?.highlights || []).map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-2 py-1">
                      <span className="text-xs leading-relaxed">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeHighlightPoint(index)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="resume-preview-pane resume-preview-sheet min-h-[680px] w-full rounded-xl border border-slate-300 p-5 shadow-inner">
              {!resumeText ? (
                <p className="text-sm text-slate-500">Click Generate AI Resume to create your smart draft.</p>
              ) : (
                <div className="space-y-1">
                  {resumePreviewLines.map((line, index) => {
                    const trimmed = line.trim();

                    if (!trimmed) {
                      return <div key={`space-${index}`} className="h-2" />;
                    }

                    if (index === 0) {
                      return (
                        <h4 key={`line-${index}`} className="resume-preview-name text-2xl font-bold tracking-wide text-slate-900">
                          {trimmed}
                        </h4>
                      );
                    }

                    if (isResumeHeading(trimmed)) {
                      return (
                        <h5 key={`line-${index}`} className="resume-preview-heading mt-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-800">
                          {trimmed}
                        </h5>
                      );
                    }

                    if (trimmed.startsWith('- ')) {
                      return (
                        <p key={`line-${index}`} className="resume-preview-bullet text-sm leading-7 text-slate-700">
                          <span className="mr-2 text-cyan-700">-</span>
                          {trimmed.slice(2)}
                        </p>
                      );
                    }

                    return (
                      <p key={`line-${index}`} className="text-sm leading-7 text-slate-700">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
