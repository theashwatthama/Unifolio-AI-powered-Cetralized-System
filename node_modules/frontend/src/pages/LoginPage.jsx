import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [studentEmail, setStudentEmail] = useState('student@unifolio.com');
  const [studentPassword, setStudentPassword] = useState('student123');
  const [adminEmail, setAdminEmail] = useState('admin@unifolio.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [authView, setAuthView] = useState('choice');
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'Admin' ? '/admin' : '/student', { replace: true });
    }
  }, [navigate, user]);

  const handleLogin = async (event, role, email, password) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/login', { email, role, password });
      login(response.data.user);
      navigate(role === 'Admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/register-student', {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      });

      setMessage('Account created successfully. Please login from Student Login section.');
      setShowSignup(false);
      setStudentEmail(signupEmail);
      setStudentPassword('');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const openAuthView = (nextView) => {
    setAuthView(nextView);
    setError('');
    setMessage('');
    if (nextView !== 'student') {
      setShowSignup(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#22d3ee33,transparent_50%),radial-gradient(circle_at_bottom,#f59e0b33,transparent_45%)]" />

      <div className="relative mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-700/40 bg-white/95 shadow-2xl md:grid-cols-2">
          <div className="flex flex-col justify-center bg-slate-950 p-10 text-white">
            <p className="inline-flex w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Trusted Student Records
            </p>
            <h1 className="mt-6 text-4xl font-black tracking-tight">Unifolio - AI Powered Cetralized System</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Centralized and verifiable academic plus extracurricular portfolio platform for institutions.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
              <p className="font-semibold text-cyan-200">Demo Credentials</p>
              <p className="mt-2">Student: student@unifolio.com / student123</p>
              <p>Admin: admin@unifolio.com / admin123</p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900">Login Portal</h2>
            <p className="mt-1 text-sm text-slate-500">First choose your login type, then continue.</p>

            {error && (
              <p className="mt-6 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}

            {message && (
              <p className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            )}

            <div className="mt-6 space-y-4">
              {authView === 'choice' && (
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => openAuthView('student')}
                    className="rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-left transition hover:bg-cyan-100"
                  >
                    <p className="text-base font-bold text-slate-900">Continue as Student</p>
                    <p className="mt-1 text-xs text-slate-600">Login with email/password or create a new account.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAuthView('admin')}
                    className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left transition hover:bg-amber-100"
                  >
                    <p className="text-base font-bold text-slate-900">Continue as Admin</p>
                    <p className="mt-1 text-xs text-slate-600">Admin portal access with secure credentials.</p>
                  </button>
                </div>
              )}

              {authView === 'student' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Student Login</h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowSignup((prev) => !prev)}
                        className="text-xs font-semibold text-cyan-700 hover:text-cyan-600"
                      >
                        {showSignup ? 'Close Signup' : 'Create Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuthView('choice')}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Back
                      </button>
                    </div>
                  </div>

                  <form
                    onSubmit={(event) => handleLogin(event, 'Student', studentEmail, studentPassword)}
                    className="space-y-3 rounded-2xl border border-slate-200 p-4"
                  >
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(event) => setStudentEmail(event.target.value)}
                      placeholder="Student Email"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      required
                      value={studentPassword}
                      onChange={(event) => setStudentPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Processing...' : 'Student Login'}
                    </button>
                  </form>

                  {showSignup && (
                    <form onSubmit={handleSignup} className="space-y-3 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
                      <h3 className="text-base font-bold text-slate-900">Create Student Account</h3>

                      <input
                        required
                        value={signupName}
                        onChange={(event) => setSignupName(event.target.value)}
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(event) => setSignupEmail(event.target.value)}
                        placeholder="Email"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={signupPassword}
                        onChange={(event) => setSignupPassword(event.target.value)}
                        placeholder="Password (min 6 chars)"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? 'Creating...' : 'Create Student Account'}
                      </button>
                    </form>
                  )}
                </>
              )}

              {authView === 'admin' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Admin Login</h3>
                    <button
                      type="button"
                      onClick={() => openAuthView('choice')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Back
                    </button>
                  </div>

                  <form
                    onSubmit={(event) => handleLogin(event, 'Admin', adminEmail, adminPassword)}
                    className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4"
                  >
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(event) => setAdminEmail(event.target.value)}
                      placeholder="Admin Email"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Processing...' : 'Admin Login'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-4 pb-2 text-center text-xs text-slate-300">
        Copyright {new Date().getFullYear()} Unifolio - AI Powered Cetralized System. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;
