import { QueryProvider } from './app/providers/QueryProvider';
import { AppRouter } from './app/router/AppRouter';

export function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
}
