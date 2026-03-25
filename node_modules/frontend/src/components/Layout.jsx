import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleStyles = {
  Student: 'bg-blue-100 text-blue-800 border-blue-300',
  Admin: 'bg-amber-100 text-amber-800 border-amber-300',
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell-bg relative min-h-screen overflow-hidden">
      <div className="app-shell-aurora pointer-events-none absolute inset-0" />
      <div className="app-shell-grid pointer-events-none absolute inset-0" />
      <div className="app-shell-blob app-shell-blob-one" />
      <div className="app-shell-blob app-shell-blob-two" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="shell-header mb-6 rounded-3xl border p-4 backdrop-blur md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="shell-heading-row">
              <h1 className="shell-title text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Unifolio - AI Powered Cetralized System
              </h1>
              <span className="shell-heading-sep" aria-hidden="true">
                |
              </span>
              <p className="shell-subtitle text-sm font-medium text-slate-600">
                Unified trusted portfolio for student achievements
              </p>
            </div>

            {user && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="shell-chip rounded-full border px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-slate-700">
                  {user.name}
                </span>
                <span
                  className={`shell-chip rounded-full border px-4 py-1.5 text-sm font-extrabold ${
                    roleStyles[user.role] || 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {user.role}
                </span>

                {user.role === 'Student' && (
                  <>
                    <Link
                      to="/student"
                      className="shell-nav-btn shell-nav-btn-primary rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/add-achievement"
                      className="shell-nav-btn rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
                    >
                      Add Achievement
                    </Link>
                    <Link
                      to={`/profile/${user._id}`}
                      className="shell-nav-btn shell-nav-btn-success rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700"
                    >
                      My Profile
                    </Link>
                  </>
                )}

                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    className="shell-nav-btn shell-nav-btn-primary rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="shell-nav-btn shell-nav-btn-danger rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-6 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-center text-xs text-slate-500 shadow-sm backdrop-blur">
          Copyright {new Date().getFullYear()} Unifolio - AI Powered Cetralized System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Layout;
