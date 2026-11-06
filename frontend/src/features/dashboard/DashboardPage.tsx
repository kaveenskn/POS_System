import { SalesOverview } from './components/SalesOverview';
import { StatCard } from './components/StatCard';

const stats = [
  {
    label: "Today's sales",
    value: 'Rs. 44,000',
    description: '2 invoices completed',
    icon: 'trend' as const,
    tone: 'orange' as const,
  },
  {
    label: 'Total revenue',
    value: 'Rs. 1,505,358',
    description: '140 invoices',
    icon: 'money' as const,
    tone: 'green' as const,
  },
  {
    label: 'Total products',
    value: '9',
    description: '173 units in stock',
    icon: 'package' as const,
    tone: 'gray' as const,
  },
  {
    label: 'Low stock',
    value: '2',
    description: 'At or below minimum',
    icon: 'warning' as const,
    tone: 'yellow' as const,
  },
];

export function DashboardPage() {
  return (
    <>
      <section className="welcome-banner" aria-labelledby="welcome-title">
        <p>Welcome back, Admin</p>
        <h1 id="welcome-title">TorqueLine Moto Parts</h1>
      </section>

      <section className="stats-grid" aria-label="Business statistics">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <SalesOverview />
    </>
  );
}
