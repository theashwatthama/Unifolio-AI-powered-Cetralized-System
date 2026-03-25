const StatCard = ({ title, value, accent = 'text-slate-900', helper }) => {
  return (
    <div className="surface-card stat-card rounded-2xl p-5">
      <p className="text-sm font-semibold tracking-wide text-slate-500">{title}</p>
      <p className={`mt-2 text-4xl font-black leading-none ${accent}`}>{value}</p>
      {helper && <p className="mt-3 text-xs text-slate-500">{helper}</p>}
    </div>
  );
};

export default StatCard;
