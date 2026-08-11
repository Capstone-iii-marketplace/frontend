import { useEffect, useState } from 'react';
import NavBar from './Navbar';
import { marketplaceApi } from '../../api/client';
import { useAuth } from '../../context/useAuth';

function Home() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState('Checking backend...');
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadBackendInfo() {
      try {
        const [health, root] = await Promise.all([
          marketplaceApi.health(),
          marketplaceApi.root(),
        ]);

        if (!isMounted) return;

        setApiStatus(`Backend: ${health.status}. Database: ${health.database}.`);
        setApiMessage(root.message || '');
      } catch (error) {
        if (!isMounted) return;
        setApiStatus(error.message || 'Backend is not reachable.');
      }
    }

    loadBackendInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      <NavBar />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-wide text-primary">Marketplace</p>
          <h1 className="mt-2 text-4xl font-bold">Welcome, {user?.name || 'seller'}.</h1>
          <p className="mt-4 text-lg text-base-content/70">
            Your frontend is authenticated against the backend API and ready for protected marketplace data.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-base-300 bg-base-200 p-5">
            <h2 className="text-lg font-semibold">Signed-in Account</h2>
            <p className="mt-3">{user?.name}</p>
            <p className="text-base-content/70">{user?.email}</p>
          </div>

          <div className="rounded-lg border border-base-300 bg-base-200 p-5">
            <h2 className="text-lg font-semibold">Backend Connection</h2>
            <p className="mt-3">{apiStatus}</p>
            {apiMessage && <p className="mt-2 text-base-content/70">{apiMessage}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
