import { Icon } from './Icon';

export function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <h2>Dashboard</h2>
      <div className="header-actions">
        <label className="search-field">
          <span className="sr-only">Search</span>
          <Icon name="search" size={20} />
          <input type="search" placeholder="Search parts, invoices..." />
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
