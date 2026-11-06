type IconName =
  | 'bell'
  | 'box'
  | 'chart'
  | 'chevron'
  | 'grid'
  | 'money'
  | 'package'
  | 'people'
  | 'search'
  | 'trend'
  | 'warning'
  | 'cart';

type IconProps = { name: IconName; size?: number };

export function Icon({ name, size = 24 }: IconProps) {
  const paths: Record<IconName, JSX.Element> = {
    bell: <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    box: <path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10" />,
    chart: <path d="M4 19V9m5 10V5m5 14v-7m5 7V3M2 19h20" />,
    chevron: <path d="m14 7-5 5 5 5" />,
    grid: <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" />,
    money: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 9h.01M18 15h.01" />
      </>
    ),
    package: (
      <>
        <path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10" />
        <path d="M7.5 5 16 9" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    trend: <path d="m3 17 6-6 4 4 8-9M15 6h6v6" />,
    warning: (
      <>
        <path d="m12 3 9 17H3L12 3Z" />
        <path d="M12 9v5m0 3h.01" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 11h10.5L20 8H6" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="17" cy="19" r="1" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
