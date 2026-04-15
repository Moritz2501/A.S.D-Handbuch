import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-tight text-white">
          ASD Handbuch
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link href="/handbook" className="transition hover:text-orange-400">
            Handbuch
          </Link>
          <Link href="/internal" className="rounded-full border border-orange-500 bg-orange-500/10 px-4 py-2 text-orange-300 transition hover:bg-orange-500/15 hover:text-orange-100">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
