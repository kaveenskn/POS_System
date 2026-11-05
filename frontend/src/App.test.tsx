import { render, screen } from '@testing-library/react';

import { App } from './App';

describe('App', () => {
  it('renders the foundation dashboard', () => {
    render(<App />);
    expect(
      screen.getByText('Welcome to your POS foundation'),
    ).toBeInTheDocument();
  });
});
