const Badge = ({ status }) => {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Verified
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      Pending
    </span>
  );
};

export default Badge;
