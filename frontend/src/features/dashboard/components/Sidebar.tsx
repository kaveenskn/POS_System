import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

type SidebarProps = { expanded: boolean; onToggle: () => void };

const navigation = [
  { label: 'Dashboard', icon: 'grid' as const, path: '/dashboard' },
  { label: 'Sales & Billing', icon: 'cart' as const, path: '/sales' },
  { label: 'Inventory', icon: 'package' as const, path: '/inventory' },
  { label: 'Wholesale', icon: 'truck' as const, path: '/wholesale' },
  { label: 'Expenses', icon: 'money' as const, path: '/expenses' },
  { label: 'Reports', icon: 'chart' as const, path: '/reports' },
];

export function Sidebar({ expanded, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="dashboard-sidebar">
      <div
        className="sidebar-brand cursor-pointer"
        onClick={() => navigate('/dashboard')}
      >
        <span className="brand-mark">⚙</span>
        <span className="brand-name">TorqueLine Moto Parts</span>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              className={`sidebar-link ${isActive ? 'is-active' : ''}`}
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-user">
        <span className="avatar">A</span>
        <span className="user-copy">
          <strong>Admin</strong>
          <small>Administrator</small>
        </span>
      </div>
      <button
        className="sidebar-toggle"
        type="button"
        onClick={onToggle}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <Icon name="chevron" />
      </button>
    </aside>
  );
}
