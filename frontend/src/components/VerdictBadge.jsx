import { CheckCircle2, XCircle, AlertTriangle, UserCheck, UserX } from 'lucide-react';

const config = {
  eligible:              { label: 'Eligible',         color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  not_eligible:          { label: 'Not Eligible',     color: 'bg-red-500/15 text-red-400 border-red-500/30',           icon: XCircle },
  manual_review:         { label: 'Manual Review',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',     icon: AlertTriangle },
  reviewed_eligible:     { label: 'Reviewed ✓',       color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', icon: UserCheck },
  reviewed_not_eligible: { label: 'Reviewed ✗',       color: 'bg-red-500/20 text-red-300 border-red-400/40',           icon: UserX },
  pending:               { label: 'Pending',          color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',     icon: AlertTriangle },
  under_evaluation:      { label: 'Evaluating',       color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',        icon: AlertTriangle },
};

export default function VerdictBadge({ status, size = 'sm' }) {
  const s = status?.toLowerCase?.() || 'pending';
  const c = config[s] || config.pending;
  const Icon = c.icon;
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full border font-semibold ${c.color}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {c.label}
    </span>
  );
}
