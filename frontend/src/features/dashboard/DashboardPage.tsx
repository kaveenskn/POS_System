const cards = [
  ['Architecture', 'Frontend and backend foundations are ready.'],
  ['Security', 'Configuration is environment-driven by default.'],
  ['Next step', 'POS modules can be added incrementally.'],
];

export function DashboardPage() {
  return (
    <section>
      <div className="mb-10">
        <p className="eyebrow mb-3">Dashboard</p>
        <h1 className="page-title">Welcome to your POS foundation</h1>
        <p className="page-description mt-4 max-w-2xl">
          A secure, scalable workspace is ready for future POS capabilities.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map(([title, description]) => (
          <article key={title} className="content-card p-6">
            <h2 className="content-card-title">{title}</h2>
            <p className="card-description mt-3 leading-6">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
