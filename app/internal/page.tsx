import LoginForm from './LoginForm';
import Navbar from '@/app/components/Navbar';

export default function InternalLoginPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <section className="mx-auto mt-24 max-w-md px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-surface/90 p-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Interner Zugang</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Admin Login</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Melde dich mit deinem Admin-Account an, um das interne Dashboard zu verwalten.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
