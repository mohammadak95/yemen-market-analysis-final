import Link from 'next/link';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <div>
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between">
          <Link href="/" className="text-white font-bold">Yemen Market Analysis</Link>
          <Link href="/methodology" className="text-white">Methodology</Link>
        </div>
      </nav>
      <Dashboard />
    </div>
  );
}
