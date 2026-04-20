export default function Footer() {
  return (
    <footer className="relative border-t border-orange-500/15 bg-gradient-to-b from-black via-surface to-black/95 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-center sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between md:text-left lg:px-8">
        <p className="text-sm leading-6 text-slate-300 sm:text-[0.95rem]">
          Mit Herz <span className="heart-pulse inline-block text-base text-red-500">♥</span> programmiert von Moritz Bauer.
        </p>
        <p className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-400 sm:text-[0.7rem] md:justify-end">
          © 2026 - ASD Intern
        </p>
      </div>
    </footer>
  );
}