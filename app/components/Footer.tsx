export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
        <p className="text-sm text-slate-300">
          Mit Herz <span className="heart-pulse inline-block text-red-500">♥</span> Programmiert von Moritz Bauer.
        </p>
        <p className="text-sm text-slate-400">© 2026 - ASD Intern</p>
      </div>
    </footer>
  );
}