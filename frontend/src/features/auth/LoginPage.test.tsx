import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders login card with brand, fields, and actions matching design', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('TorqueLine Moto Parts')).toBeInTheDocument();
    expect(screen.getByText('POS management')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Enter POS/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Demo mode — any credentials work\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Back to shop/i }),
    ).toBeInTheDocument();
  });
});

