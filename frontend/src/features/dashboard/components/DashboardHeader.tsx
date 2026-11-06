import { Icon } from './Icon';

interface DashboardHeaderProps {
  title?: string;
  onSearch?: (query: string) => void;
}

export function DashboardHeader({ title = 'Dashboard', onSearch }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <h2>{title}</h2>
      <div className="header-actions">
        <label className="search-field">
          <span className="sr-only">Search</span>
          <Icon name="search" size={20} />
          <input
            type="search"
            placeholder="Search parts, invoices..."
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </label>
        <button
          className="notification-button"
          type="button"
          aria-label="Notifications"
        >
          <Icon name="bell" size={22} />
          <span />
        </button>
        <span className="header-avatar">A</span>
      </div>
    </header>
  );
}
