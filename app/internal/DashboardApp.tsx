'use client';

import { useEffect, useMemo, useState } from 'react';
import LogoutButton from './LogoutButton';

const rankOptions = [
  { value: 'ASD_Director', label: 'A.S.D Director' },
  { value: 'ASD_Co_Director', label: 'A.S.D Co Director' },
  { value: 'Flight_Instructor', label: 'Flight Instructor' },
  { value: 'Senior_Flight_Officer', label: 'Senior Flight Officer' },
  { value: 'Flight_Officer', label: 'Flight Officer' },
  { value: 'Flight_Student', label: 'Flight Student' },
];

const trainingOptions = ['Basic Flight Training', 'Advanced Navigation', 'Emergency Response'];

function simpleDate(value: string) {
  return value ? new Date(value).toISOString().split('T')[0] : '';
}

export default function DashboardApp() {
  const [activeTab, setActiveTab] = useState<'members' | 'training' | 'duty' | 'checks' | 'handbook'>('members');
  const [members, setMembers] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [dutyTimes, setDutyTimes] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [newMember, setNewMember] = useState({ name: '', rank: 'Flight_Officer', joinedAt: simpleDate(new Date().toISOString()) });
  const [dutyForm, setDutyForm] = useState({ startDate: simpleDate(new Date().toISOString()), endDate: simpleDate(new Date(Date.now() + 6048e5).toISOString()), hours: '0', minutes: '0', memberId: '', isVacation: false });
  const [trainingForm, setTrainingForm] = useState({ memberId: '', title: trainingOptions[0], completed: false });
  const [newPage, setNewPage] = useState({ title: '', slug: '', description: '', published: false });
  const [editorBlocks, setEditorBlocks] = useState([{ type: 'TEXT', content: '<p>Erstelle Inhalte hier...</p>' }]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [membersRes, trainingsRes, dutiesRes, pagesRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/trainings'),
          fetch('/api/duty-times'),
          fetch('/api/handbook/pages'),
        ]);
        setMembers(await membersRes.json());
        setTrainings(await trainingsRes.json());
        setDutyTimes(await dutiesRes.json());
        setPages(await pagesRes.json());
      } catch (err) {
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const officerMembers = useMemo(
    () => members.filter((member) => !['Flight_Student', 'ASD_Director', 'ASD_Co_Director'].includes(member.rank)),
    [members]
  );
  const studentMembers = useMemo(() => members.filter((member) => member.rank === 'Flight_Student'), [members]);
  const directorMembers = useMemo(() => members.filter((member) => ['ASD_Director', 'ASD_Co_Director'].includes(member.rank)), [members]);

  async function refreshData() {
    try {
      const [membersRes, trainingsRes, dutiesRes, pagesRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/trainings'),
        fetch('/api/duty-times'),
        fetch('/api/handbook/pages'),
      ]);
      setMembers(await membersRes.json());
      setTrainings(await trainingsRes.json());
      setDutyTimes(await dutiesRes.json());
      setPages(await pagesRes.json());
    } catch (err) {
      setError('Fehler beim Laden der Daten');
    }
  }

  async function handleMemberSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMember) });
      setNewMember({ name: '', rank: 'Flight_Officer', joinedAt: simpleDate(new Date().toISOString()) });
      await refreshData();
    } catch (err) {
      setError('Mitglied konnte nicht hinzugefügt werden');
    }
  }

  async function handleDeleteMember(id: string) {
    await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
    await refreshData();
  }

  async function handleDutySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await fetch('/api/duty-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: dutyForm.memberId,
          startDate: dutyForm.startDate,
          endDate: dutyForm.endDate,
          hours: dutyForm.isVacation ? 0 : Number(dutyForm.hours || 0),
          minutes: dutyForm.isVacation ? 0 : Number(dutyForm.minutes || 0),
          isVacation: dutyForm.isVacation,
        }),
      });
      setDutyForm((current) => ({ ...current, hours: '0', minutes: '0', isVacation: false }));
      await refreshData();
    } catch (err) {
      setError('Dienstzeit konnte nicht gespeichert werden');
    }
  }

  async function handleTrainingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingForm),
      });
      setTrainingForm({ memberId: '', title: trainingOptions[0], completed: false });
      await refreshData();
    } catch (err) {
      setError('Training konnte nicht gespeichert werden');
    }
  }

  async function handlePageSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = { ...newPage, blocks: editorBlocks };
      await fetch('/api/handbook/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setNewPage({ title: '', slug: '', description: '', published: false });
      setEditorBlocks([{ type: 'TEXT', content: '<p>Erstelle Inhalte hier...</p>' }]);
      await refreshData();
    } catch (err) {
      setError('Seite konnte nicht gespeichert werden');
    }
  }

  function handleBlockChange(index: number, key: string, value: string) {
    setEditorBlocks((current) => current.map((block, idx) => (idx === index ? { ...block, [key]: value } : block)));
  }

  function addBlock(type: string) {
    setEditorBlocks((current) => [...current, { type, content: type === 'DIVIDER' ? '' : '' }]);
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="mx-auto mt-10 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-surface/80 p-6 shadow-glow backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Admin Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold">ASD Management</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[240px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
            <div className="space-y-2">
              {['members', 'training', 'duty', 'checks', 'handbook'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${activeTab === tab ? 'bg-orange-500/10 text-white' : 'text-slate-300 hover:bg-orange-500/10 hover:text-white'}`}
                >
                  {tab === 'members' && 'Mitglieder'}
                  {tab === 'training' && 'Ausbildung'}
                  {tab === 'duty' && 'Dienstzeiten'}
                  {tab === 'checks' && 'Flugüberprüfungen'}
                  {tab === 'handbook' && 'Handbuch Verwaltung'}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
            {loading && <div className="rounded-3xl border border-white/10 bg-black/50 p-6 text-slate-300">Daten werden geladen …</div>}

            {!loading && activeTab === 'members' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Mitglieder</h2>
                    <p className="mt-2 text-slate-400">Verwalte das ASD-Team und erstelle neue Einträge.</p>
                  </div>
                </div>
                <form onSubmit={handleMemberSubmit} className="mt-6 grid gap-4 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newMember.name}
                    onChange={(event) => setNewMember({ ...newMember, name: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                    required
                  />
                  <select
                    value={newMember.rank}
                    onChange={(event) => setNewMember({ ...newMember, rank: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                  >
                    {rankOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newMember.joinedAt}
                      onChange={(event) => setNewMember({ ...newMember, joinedAt: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                      required
                    />
                    <button className="rounded-2xl bg-orange-500 px-5 py-3 text-black transition hover:bg-orange-400">Erstellen</button>
                  </div>
                </form>

                <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/50">
                  <table className="min-w-full text-left text-sm text-slate-300">
                    <thead className="border-b border-white/10 bg-surface text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Rang</th>
                        <th className="px-4 py-3">Beitritt</th>
                        <th className="px-4 py-3">Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b border-white/10 last:border-none">
                          <td className="px-4 py-4 text-white">{member.name}</td>
                          <td className="px-4 py-4 text-slate-300">{member.rank.replaceAll('_', ' ')}</td>
                          <td className="px-4 py-4 text-slate-300">{new Date(member.joinedAt).toLocaleDateString('de-DE')}</td>
                          <td className="px-4 py-4">
                            <button onClick={() => handleDeleteMember(member.id)} className="rounded-2xl border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10">
                              Entfernen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!loading && activeTab === 'training' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <h2 className="text-2xl font-semibold">Ausbildung</h2>
                <p className="mt-2 text-slate-400">Schließe Ausbildungen für Flight Students oder Officer ab.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
                    <h3 className="text-lg font-semibold text-white">Flight Students</h3>
                    <div className="mt-4 space-y-3">
                      {studentMembers.map((member) => (
                        <div key={member.id} className="rounded-2xl border border-white/10 bg-surface p-3">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-slate-400">{member.rank.replaceAll('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
                    <h3 className="text-lg font-semibold text-white">Officer Fortbildung</h3>
                    <div className="mt-4 space-y-3">
                      {officerMembers.map((member) => (
                        <div key={member.id} className="rounded-2xl border border-white/10 bg-surface p-3">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-slate-400">{member.rank.replaceAll('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleTrainingSubmit} className="mt-6 grid gap-4 sm:grid-cols-4">
                  <select
                    value={trainingForm.memberId}
                    onChange={(event) => setTrainingForm({ ...trainingForm, memberId: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                    required
                  >
                    <option value="">Mitglied auswählen</option>
                    {members
                      .filter((member) => !['ASD_Director', 'ASD_Co_Director'].includes(member.rank))
                      .map((member) => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                  </select>
                  <select
                    value={trainingForm.title}
                    onChange={(event) => setTrainingForm({ ...trainingForm, title: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                  >
                    {trainingOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-slate-300">
                    <input
                      type="checkbox"
                      checked={trainingForm.completed}
                      onChange={(event) => setTrainingForm({ ...trainingForm, completed: event.target.checked })}
                      className="h-4 w-4 rounded border-white/10 bg-black/70 text-orange-500"
                    />
                    Abgeschlossen
                  </label>
                  <button className="rounded-2xl bg-orange-500 px-5 py-3 text-black transition hover:bg-orange-400">Training hinzufügen</button>
                </form>

                <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/50">
                  <table className="min-w-full text-left text-sm text-slate-300">
                    <thead className="border-b border-white/10 bg-surface text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Rang</th>
                        <th className="px-4 py-3">Ausbildungen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members
                      .filter((member) => !['ASD_Director', 'ASD_Co_Director'].includes(member.rank))
                      .map((member) => (
                        <tr key={member.id} className="border-b border-white/10 last:border-none">
                          <td className="px-4 py-4 text-white">{member.name}</td>
                          <td className="px-4 py-4 text-slate-300">{member.rank.replaceAll('_', ' ')}</td>
                          <td className="px-4 py-4">
                            {trainingOptions.map((title) => {
                              const completed = trainings.some((training) => training.memberId === member.id && training.title === title && training.completed);
                              return (
                                <label key={title} className="mr-3 inline-flex items-center gap-2 text-sm text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    readOnly
                                    className="h-4 w-4 rounded border-white/10 bg-black/80 text-orange-500"
                                  />
                                  {title}
                                </label>
                              );
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!loading && activeTab === 'duty' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <h2 className="text-2xl font-semibold">Dienstzeiten</h2>
                <p className="mt-2 text-slate-400">Erfasse Arbeitsstunden oder markiere Urlaube.</p>
                <form onSubmit={handleDutySubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <select
                    value={dutyForm.memberId}
                    onChange={(event) => setDutyForm({ ...dutyForm, memberId: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                    required
                  >
                    <option value="">Officer auswählen</option>
                    {officerMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={dutyForm.startDate}
                    onChange={(event) => setDutyForm({ ...dutyForm, startDate: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                    required
                  />
                  <input
                    type="date"
                    value={dutyForm.endDate}
                    onChange={(event) => setDutyForm({ ...dutyForm, endDate: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <input
                        type="number"
                        min="0"
                        value={dutyForm.hours}
                        onChange={(event) => setDutyForm({ ...dutyForm, hours: event.target.value })}
                        className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                        placeholder="Stunden"
                        disabled={dutyForm.isVacation}
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={dutyForm.isVacation}
                          onChange={(event) => setDutyForm({ ...dutyForm, isVacation: event.target.checked })}
                          className="h-4 w-4 rounded border-white/10 bg-black/70 text-orange-500"
                        />
                        Urlaub
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={dutyForm.minutes}
                      onChange={(event) => setDutyForm({ ...dutyForm, minutes: event.target.value })}
                      className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                      placeholder="Minuten"
                      disabled={dutyForm.isVacation}
                    />
                  </div>
                  <button className="rounded-2xl bg-orange-500 px-5 py-3 text-black transition hover:bg-orange-400">Eintragen</button>
                </form>

                <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/50">
                  <table className="min-w-full text-left text-sm text-slate-300">
                    <thead className="border-b border-white/10 bg-surface text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Zeitraum</th>
                        <th className="px-4 py-3">Stunden</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dutyTimes.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/10 last:border-none">
                          <td className="px-4 py-4 text-white">{entry.member?.name}</td>
                          <td className="px-4 py-4 text-slate-300">{new Date(entry.startDate).toLocaleDateString('de-DE')} – {new Date(entry.endDate).toLocaleDateString('de-DE')}</td>
                          <td className="px-4 py-4 text-slate-300">{entry.isVacation ? '0' : `${entry.hours}h ${entry.minutes}m`}</td>
                          <td className="px-4 py-4 text-slate-300">{entry.isVacation ? 'Urlaub' : 'Gebucht'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!loading && activeTab === 'checks' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <h2 className="text-2xl font-semibold">Flugüberprüfungen</h2>
                <p className="mt-2 text-slate-400">Dieser Bereich ist derzeit ein Platzhalter. Kommt später.</p>
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/50 p-6 text-slate-300">Content folgt in einer späteren Version. Bereite Pilotenbewertungen und Flugchecks vor.</div>
              </section>
            )}

            {!loading && activeTab === 'handbook' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <h2 className="text-2xl font-semibold">Handbuch Verwaltung</h2>
                <p className="mt-2 text-slate-400">Erstelle Seiten, bearbeite Inhalte und veröffentliche sie für den öffentlichen Bereich.</p>

                <form onSubmit={handlePageSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Titel"
                      value={newPage.title}
                      onChange={(event) => setNewPage({ ...newPage, title: event.target.value })}
                      className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Slug"
                      value={newPage.slug}
                      onChange={(event) => setNewPage({ ...newPage, slug: event.target.value })}
                      className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                      required
                    />
                    <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-slate-200">
                      <input
                        type="checkbox"
                        checked={newPage.published}
                        onChange={(event) => setNewPage({ ...newPage, published: event.target.checked })}
                        className="h-4 w-4 rounded border-white/10 bg-black/70 text-orange-500"
                      />
                      Veröffentlichen
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Beschreibung"
                    value={newPage.description}
                    onChange={(event) => setNewPage({ ...newPage, description: event.target.value })}
                    className="w-full rounded-3xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <button type="button" onClick={() => addBlock('TEXT')} className="rounded-2xl border border-orange-500 px-4 py-3 text-orange-300 hover:bg-orange-500/10">
                      Textblock
                    </button>
                    <button type="button" onClick={() => addBlock('IMAGE')} className="rounded-2xl border border-orange-500 px-4 py-3 text-orange-300 hover:bg-orange-500/10">
                      Bildblock
                    </button>
                    <button type="button" onClick={() => addBlock('VIDEO')} className="rounded-2xl border border-orange-500 px-4 py-3 text-orange-300 hover:bg-orange-500/10">
                      Video
                    </button>
                    <button type="button" onClick={() => addBlock('DIVIDER')} className="rounded-2xl border border-orange-500 px-4 py-3 text-orange-300 hover:bg-orange-500/10">
                      Trennlinie
                    </button>
                  </div>
                  <div className="space-y-4">
                    {editorBlocks.map((block, index) => (
                      <div key={`${block.type}-${index}`} className="rounded-3xl border border-white/10 bg-black/70 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold text-white">{block.type}</span>
                          <button
                            type="button"
                            onClick={() => setEditorBlocks((current) => current.filter((_, idx) => idx !== index))}
                            className="text-sm text-orange-300 hover:text-orange-100"
                          >
                            Entfernen
                          </button>
                        </div>
                        {block.type !== 'DIVIDER' ? (
                          <textarea
                            rows={4}
                            value={block.content}
                            onChange={(event) => handleBlockChange(index, 'content', event.target.value)}
                            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none"
                            placeholder={block.type === 'IMAGE' ? 'Bild-URL einfügen' : block.type === 'VIDEO' ? 'Embed-Link einfügen' : 'HTML-Inhalt einfügen'}
                          />
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">Trennlinie wird ohne weiteren Inhalt dargestellt.</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="rounded-2xl bg-orange-500 px-5 py-3 text-black transition hover:bg-orange-400">Speichern</button>
                </form>

                <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/50">
                  <div className="border-b border-white/10 bg-surface px-4 py-4 text-slate-300">Vorhandene Seiten</div>
                  <div className="space-y-2 p-4">
                    {pages.map((page) => (
                      <div key={page.id} className="rounded-3xl border border-white/10 bg-surface p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-white">{page.title}</p>
                            <p className="text-sm text-slate-400">Slug: {page.slug}</p>
                          </div>
                          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-300">{page.published ? 'Veröffentlicht' : 'Entwurf'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
