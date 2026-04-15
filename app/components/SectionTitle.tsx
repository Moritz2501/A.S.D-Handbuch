export default function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm uppercase tracking-[0.3em] text-orange-400">{subtitle}</p>
      <h2 className="text-3xl font-semibold text-white tracking-tight">{title}</h2>
    </div>
  );
}
