import { Icon } from './Icon';

export interface StatCardProps {
  label: string;
  value: string;
  description: string;
  icon: 'trend' | 'money' | 'package' | 'warning' | 'cart' | 'chart';
  tone: 'orange' | 'green' | 'gray' | 'yellow';
  badge?: {
    text: string;
    positive?: boolean;
    neutral?: boolean;
  };
}

export function StatCard({
  label,
  value,
  description,
  icon,
  tone,
  badge,
}: StatCardProps) {
  return (
    <article className="stat-card transition-all duration-200 hover:border-[#383a42] hover:shadow-lg">
      <div className={`stat-icon stat-icon-${tone}`}>
        <Icon name={icon} size={23} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <p className="!mb-0 text-sm font-medium text-[#9a9ca6]">{label}</p>
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              badge.neutral
                ? 'bg-[#25272e] text-[#a0a4b0]'
                : badge.positive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <strong className="tracking-tight text-white">{value}</strong>
      <small className="text-[#80838f] block mt-1">{description}</small>
    </article>
  );
}
