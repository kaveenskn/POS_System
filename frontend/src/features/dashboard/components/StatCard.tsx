import { Icon } from './Icon';

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: 'trend' | 'money' | 'package' | 'warning';
  tone: 'orange' | 'green' | 'gray' | 'yellow';
};

export function StatCard({
  label,
  value,
  description,
  icon,
  tone,
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>
        <Icon name={icon} size={23} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}
