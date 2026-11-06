export function SalesOverview() {
  return (
    <section className="sales-overview" aria-labelledby="sales-overview-title">
      <h2 id="sales-overview-title">Sales overview</h2>
      <div
        className="chart"
        role="img"
        aria-label="Sales overview line chart placeholder"
      >
        <div className="chart-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
        <svg viewBox="0 0 900 190" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f04b2f" stopOpacity=".25" />
              <stop offset="1" stopColor="#f04b2f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="chart-area"
            d="M0 165 C75 155 95 130 155 145 S260 105 320 130 S430 70 495 100 S600 125 660 80 S760 120 820 50 S870 65 900 35 V190 H0Z"
          />
          <path
            className="chart-line"
            d="M0 165 C75 155 95 130 155 145 S260 105 320 130 S430 70 495 100 S600 125 660 80 S760 120 820 50 S870 65 900 35"
          />
        </svg>
        <div className="chart-labels">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>
    </section>
  );
}
