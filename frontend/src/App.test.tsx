import { render, screen } from '@testing-library/react';

import { App } from './App';

describe('App', () => {
  it('renders the TorqueLine Moto Parts landing page', () => {
    render(<App />);
    expect(screen.getByText('TorqueLine Moto Parts')).toBeInTheDocument();
    expect(screen.getByText('MOTORCYCLE SPARE PARTS')).toBeInTheDocument();
    expect(screen.getByText('Everything Your')).toBeInTheDocument();
    expect(screen.getByText('Ride Needs.')).toBeInTheDocument();
    expect(screen.getByText('Shop parts')).toBeInTheDocument();
    expect(screen.getByText('Staff login')).toBeInTheDocument();
  });
});
