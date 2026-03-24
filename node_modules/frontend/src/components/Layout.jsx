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
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Unifolio - AI Powered Cetralized System
              </h1>
              <p className="text-sm text-slate-500">Unified trusted portfolio for student achievements</p>
            </div>

            {user && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {user.name}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    roleStyles[user.role] || 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {user.role}
                </span>

                {user.role === 'Student' && (
                  <>
                    <Link
                      to="/student"
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/add-achievement"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Add Achievement
                    </Link>
                    <Link
                      to={`/profile/${user._id}`}
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Public Profile
                    </Link>
                  </>
                )}

                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500 shadow-sm">
          Copyright {new Date().getFullYear()} Unifolio - AI Powered Cetralized System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Layout;
