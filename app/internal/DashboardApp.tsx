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

const rankHierarchy = [
  'Flight_Student',
  'Flight_Officer',
  'Senior_Flight_Officer',
  'Flight_Instructor',
  'ASD_Co_Director',
  'ASD_Director',
];

const trainingOptions = ['Basic Flight Training', 'Advanced Navigation', 'Emergency Response'];

function simpleDate(value: string) {
  return value ? new Date(value).toISOString().split('T')[0] : '';
}

export default function DashboardApp() {
  const [activeTab, setActiveTab] = useState<'members' | 'training' | 'duty' | 'checks' | 'handbook' | 'fortbildungen'>('members');
  const [members, setMembers] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [dutyTimes, setDutyTimes] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [newMember, setNewMember] = useState({ name: '', rank: 'Flight_Officer', joinedAt: simpleDate(new Date().toISOString()) });
  const [dutyForm, setDutyForm] = useState({ startDate: simpleDate(new Date().toISOString()), endDate: simpleDate(new Date(Date.now() + 6048e5).toISOString()), hours: '0', minutes: '0', memberId: '', isVacation: false });
  const [trainingForm, setTrainingForm] = useState({ memberId: '', title: trainingOptions[0], completed: false });
  const [newPage, setNewPage] = useState({ title: '', description: '', published: false });
  const [editingPage, setEditingPage] = useState<any>(null);
  const [availableTrainings, setAvailableTrainings] = useState<any[]>([]);
  const [newTrainingTitle, setNewTrainingTitle] = useState('');
  const [editorBlocks, setEditorBlocks] = useState([{ type: 'TEXT', content: '<p>Erstelle Inhalte hier...</p>' }]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingModalMode, setTrainingModalMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [trainingModalTitle, setTrainingModalTitle] = useState('');
  const [trainingModalOriginalTitle, setTrainingModalOriginalTitle] = useState('');
  const [dutyModalOpen, setDutyModalOpen] = useState(false);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<'ausbildung' | 'fortbildung'>('ausbildung');
  const [showAvailableAusbildungen, setShowAvailableAusbildungen] = useState(false);
  const [showAvailableFortbildungen, setShowAvailableFortbildungen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [membersRes, trainingsRes, dutiesRes, pagesRes, trainingsManageRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/trainings'),
          fetch('/api/duty-times'),
          fetch('/api/handbook/pages'),
          fetch('/api/trainings/manage'),
        ]);
        setMembers(await membersRes.json());
        setTrainings(await trainingsRes.json());
        setDutyTimes(await dutiesRes.json());
        setPages(await pagesRes.json());
        setAvailableTrainings(await trainingsManageRes.json());
      } catch (err) {
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    setShowAvailableAusbildungen(false);
    setShowAvailableFortbildungen(false);
  }, [activeTab]);

  const sortedMembers = useMemo(() => {
    const rankOrder = ['ASD_Director', 'ASD_Co_Director', 'Flight_Instructor', 'Senior_Flight_Officer', 'Flight_Officer', 'Flight_Student'];
    return [...members].sort((a, b) => {
      const rankA = rankOrder.indexOf(a.rank);
      const rankB = rankOrder.indexOf(b.rank);
      if (rankA !== rankB) return rankA - rankB;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [members]);

  const officerMembers = useMemo(
    () => sortedMembers.filter((member) => ['Flight_Officer', 'Senior_Flight_Officer', 'Flight_Instructor'].includes(member.rank)),
    [sortedMembers]
  );
  const studentMembers = useMemo(() => sortedMembers.filter((member) => member.rank === 'Flight_Student'), [sortedMembers]);
  const directorMembers = useMemo(() => sortedMembers.filter((member) => ['ASD_Director', 'ASD_Co_Director'].includes(member.rank)), [sortedMembers]);

  async function refreshData() {
    try {
      const [membersRes, trainingsRes, dutiesRes, pagesRes, trainingsManageRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/trainings'),
        fetch('/api/duty-times'),
        fetch('/api/handbook/pages'),
        fetch('/api/trainings/manage'),
      ]);
      setMembers(await membersRes.json());
      setTrainings(await trainingsRes.json());
      setDutyTimes(await dutiesRes.json());
      setPages(await pagesRes.json());
      setAvailableTrainings(await trainingsManageRes.json());
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

  async function handleDeleteDuty(id: string) {
    if (!confirm('Dienstzeit wirklich löschen?')) return;
    try {
      await fetch('/api/duty-times', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await refreshData();
    } catch (err) {
      setError('Dienstzeit konnte nicht gelöscht werden');
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
  async function handlePromoteMember(memberId: string, newRank: string) {
    try {
      const response = await fetch('/api/members/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, newRank }),
      });
      if (!response.ok) {
        const error = await response.json();
        setError(error.error || 'Beförderung fehlgeschlagen');
        return;
      }
      await refreshData();
    } catch (err) {
      setError('Beförderung fehlgeschlagen');
    }
  }

  async function handleDemoteMember(memberId: string, newRank: string) {
    try {
      const response = await fetch('/api/members/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, newRank }),
      });
      if (!response.ok) {
        const error = await response.json();
        setError(error.error || 'Downrank fehlgeschlagen');
        return;
      }
      await refreshData();
    } catch (err) {
      setError('Downrank fehlgeschlagen');
    }
  }

  async function handleAutoPromote() {
    try {
      await fetch('/api/members/promote', { method: 'PUT' });
      await refreshData();
    } catch (err) {
      setError('Automatische Beförderung fehlgeschlagen');
    }
  }

  async function handleAddTraining() {
    if (!newTrainingTitle.trim()) return;
    try {
      await fetch('/api/trainings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTrainingTitle }),
      });
      setNewTrainingTitle('');
      await refreshData();
    } catch (err) {
      setError('Ausbildung konnte nicht hinzugefügt werden');
    }
  }

  async function handleRenameTraining(oldTitle: string, newTitle: string) {
    try {
      await fetch('/api/trainings/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldTitle, newTitle }),
      });
      await refreshData();
    } catch (err) {
      setError('Ausbildung konnte nicht umbenannt werden');
    }
  }

  async function handleDeleteTraining(title: string) {
    if (!confirm(`Ausbildung "${title}" wirklich löschen?`)) return;
    try {
      await fetch('/api/trainings/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      await refreshData();
    } catch (err) {
      setError('Ausbildung konnte nicht gelöscht werden');
    }
  }

  function startEditingPage(page: any) {
    setEditingPage(page);
    setNewPage({
      title: page.title,
      description: page.description || '',
      published: page.published,
    });
    setEditorBlocks(
      page.blocks?.length
        ? page.blocks.map((block: any) => ({
            type: block.type,
            content: block.content,
          }))
        : [{ type: 'TEXT', content: '<p>Erstelle Inhalte hier...</p>' }]
    );
  }

  function cancelEditing() {
    setEditingPage(null);
    setNewPage({ title: '', description: '', published: false });
  }
  async function handlePageSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const url = editingPage ? `/api/handbook/pages` : '/api/handbook/pages';
      const method = editingPage ? 'PATCH' : 'POST';
      const data = editingPage
        ? { ...newPage, id: editingPage.id, blocks: editorBlocks }
        : { ...newPage, blocks: editorBlocks };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setNewPage({ title: '', description: '', published: false });
      setEditingPage(null);
      setEditorBlocks([{ type: 'TEXT', content: '<p>Erstelle Inhalte hier...</p>' }]);
      await refreshData();
    } catch (err) {
      setError('Handbuch-Seite konnte nicht gespeichert werden');
    }
  }

  async function handleImageUpload(index: number, file: File) {
    setError('');
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bild-Upload fehlgeschlagen');
      }

      handleBlockChange(index, 'content', data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bild-Upload fehlgeschlagen');
    } finally {
      setIsUploadingImage(false);
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
              {['members', 'training', 'fortbildungen', 'duty', 'checks', 'handbook'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${activeTab === tab ? 'bg-orange-500/10 text-white' : 'text-slate-300 hover:bg-orange-500/10 hover:text-white'}`}
                >
                  {tab === 'members' && 'Mitglieder'}
                  {tab === 'training' && 'Ausbildung'}
                  {tab === 'fortbildungen' && 'Fortbildungen'}
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
                            <div className="flex gap-2">
                              {member.rank !== 'ASD_Director' && (
                                <button
                                  onClick={() => {
                                    const currentIndex = rankHierarchy.indexOf(member.rank);
                                    const nextRank = rankHierarchy[currentIndex + 1];
                                    if (nextRank) {
                                      handlePromoteMember(member.id, nextRank);
                                    }
                                  }}
                                  className="rounded-2xl border border-green-500/40 px-3 py-2 text-sm text-green-300 transition hover:bg-green-500/10"
                                  disabled={member.rank === 'ASD_Director'}
                                >
                                  Uprank
                                </button>
                              )}
                              {member.rank !== 'Flight_Student' && (
                                <button
                                  onClick={() => {
                                    const currentIndex = rankHierarchy.indexOf(member.rank);
                                    const prevRank = rankHierarchy[currentIndex - 1];
                                    if (prevRank) {
                                      handleDemoteMember(member.id, prevRank);
                                    }
                                  }}
                                  className="rounded-2xl border border-yellow-500/40 px-3 py-2 text-sm text-yellow-300 transition hover:bg-yellow-500/10"
                                >
                                  Downrank
                                </button>
                              )}
                              <button onClick={() => handleDeleteMember(member.id)} className="rounded-2xl border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10">
                                Entfernen
                              </button>
                            </div>
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
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Ausbildung</h2>
                    <p className="mt-2 text-slate-400">Verwalte die Ausbildungsliste und hake Trainings direkt ab.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalCategory('ausbildung');
                        setShowAvailableAusbildungen(true);
                        setShowAvailableFortbildungen(false);
                      }}
                      className="rounded-2xl bg-orange-500 px-4 py-2 text-black transition hover:bg-orange-400"
                    >
                      Ausbildung verwalten
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoPromote}
                      className="rounded-2xl bg-green-500 px-4 py-2 text-black transition hover:bg-green-400"
                    >
                      Auto-Beförderung
                    </button>
                  </div>
                </div>

                {showAvailableAusbildungen ? (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-surface p-6 shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">Verfügbare Ausbildungstitel</h3>
                          <p className="text-sm text-slate-400">Schließe das Fenster, um die Titel auszublenden.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAvailableAusbildungen(false)}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                        >
                          Schließen
                        </button>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {availableTrainings
                          .filter((training) => training.category === 'AUSBILDUNG')
                          .map((training) => (
                            <div key={`${training.category}-${training.title}`} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <span className="text-white">{training.title}</span>
                                  <p className="text-xs text-slate-400">Ausbildung</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalCategory('ausbildung');
                                      setTrainingModalMode('edit');
                                      setTrainingModalTitle(training.title);
                                      setTrainingModalOriginalTitle(training.title);
                                      setTrainingModalOpen(true);
                                    }}
                                    className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-blue-300 transition hover:bg-white/10"
                                  >
                                    Bearbeiten
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalCategory('ausbildung');
                                      setTrainingModalMode('delete');
                                      setTrainingModalOriginalTitle(training.title);
                                      setTrainingModalOpen(true);
                                    }}
                                    className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-red-300 transition hover:bg-white/10"
                                  >
                                    Löschen
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setTrainingModalMode('add');
                            setTrainingModalTitle('');
                            setTrainingModalOriginalTitle('');
                            setTrainingModalOpen(true);
                          }}
                          className="rounded-2xl bg-orange-500 px-4 py-2 text-black transition hover:bg-orange-400"
                        >
                          Ausbildung hinzufügen
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-4 text-slate-300">
                    Drücke "Ausbildung verwalten", um verfügbare Ausbildungstitel zu sehen.
                  </div>
                )}

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/50 p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Flight Students</h3>
                  <div className="space-y-4">
                    {studentMembers.map((member) => (
                      <div key={member.id} className="rounded-2xl border border-white/10 bg-surface p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-white">{member.name}</p>
                            <p className="text-sm text-slate-400">{member.rank.replaceAll('_', ' ')}</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {trainings
                              .filter((t) => t.memberId === member.id && t.category === 'AUSBILDUNG')
                              .map((training) => (
                                <button
                                  type="button"
                                  key={training.id}
                                  onClick={async () => {
                                    await fetch('/api/trainings', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: training.id, completed: !training.completed }),
                                    });
                                    await refreshData();
                                  }}
                                  className={`rounded-2xl px-3 py-2 text-left text-sm transition ${training.completed ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                                >
                                  {training.completed ? '✅' : '⬜'} {training.title}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {!loading && activeTab === 'fortbildungen' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Fortbildungen</h2>
                    <p className="mt-2 text-slate-400">Verwalte Fortbildungen für Officer und Instructoren.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModalCategory('fortbildung');
                      setShowAvailableFortbildungen(true);
                      setShowAvailableAusbildungen(false);
                    }}
                    className="rounded-2xl bg-orange-500 px-4 py-2 text-black transition hover:bg-orange-400"
                  >
                    Fortbildung verwalten
                  </button>
                </div>

                {showAvailableFortbildungen ? (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-surface p-6 shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">Verfügbare Fortbildungstitel</h3>
                          <p className="text-sm text-slate-400">Schließe das Fenster, um die Titel auszublenden.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAvailableFortbildungen(false)}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                        >
                          Schließen
                        </button>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {availableTrainings
                          .filter((training) => training.category === 'FORTBILDUNG')
                          .map((training) => (
                            <div key={`${training.category}-${training.title}`} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <span className="text-white">{training.title}</span>
                                  <p className="text-xs text-slate-400">Fortbildung</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalCategory('fortbildung');
                                      setTrainingModalMode('edit');
                                      setTrainingModalTitle(training.title);
                                      setTrainingModalOriginalTitle(training.title);
                                      setTrainingModalOpen(true);
                                    }}
                                    className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-blue-300 transition hover:bg-white/10"
                                  >
                                    Bearbeiten
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalCategory('fortbildung');
                                      setTrainingModalMode('delete');
                                      setTrainingModalOriginalTitle(training.title);
                                      setTrainingModalOpen(true);
                                    }}
                                    className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-red-300 transition hover:bg-white/10"
                                  >
                                    Löschen
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setTrainingModalMode('add');
                            setTrainingModalTitle('');
                            setTrainingModalOriginalTitle('');
                            setTrainingModalOpen(true);
                          }}
                          className="rounded-2xl bg-orange-500 px-4 py-2 text-black transition hover:bg-orange-400"
                        >
                          Fortbildung hinzufügen
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-4 text-slate-300">Drücke "Fortbildung verwalten", um verfügbare Fortbildungstitel zu sehen.</div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {officerMembers.map((member) => (
                    <div key={member.id} className="rounded-3xl border border-white/10 bg-black/50 p-4">
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="text-sm text-slate-400 mb-3">{member.rank.replaceAll('_', ' ')}</p>
                      <div className="grid gap-2">
                        {trainings
                          .filter((t) => t.memberId === member.id && t.category === 'FORTBILDUNG')
                          .map((training) => (
                            <button
                              key={training.id}
                              type="button"
                              onClick={async () => {
                                await fetch('/api/trainings', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: training.id, completed: !training.completed }),
                                });
                                await refreshData();
                              }}
                              className={`rounded-2xl px-3 py-2 text-left text-sm transition ${training.completed ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                            >
                              {training.completed ? '✅' : '⬜'} {training.title}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!loading && activeTab === 'duty' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Dienstzeiten</h2>
                    <p className="mt-2 text-slate-400">Trage Dienstzeiten über das Pop-up ein und lösche alte Einträge direkt.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDutyModalOpen(true)}
                    className="rounded-2xl bg-orange-500 px-4 py-2 text-black transition hover:bg-orange-400"
                  >
                    Dienstzeit eintragen
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  {dutyTimes.map((entry) => (
                    <div key={entry.id} className="rounded-3xl border border-white/10 bg-black/50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{entry.member?.name}</p>
                        <p className="text-sm text-slate-400">{new Date(entry.startDate).toLocaleDateString('de-DE')} – {new Date(entry.endDate).toLocaleDateString('de-DE')}</p>
                        <p className="text-sm text-slate-400">{entry.isVacation ? 'Urlaub' : `${entry.hours}h ${entry.minutes}m`}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDuty(entry.id)}
                        className="rounded-2xl border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                      >
                        Löschen
                      </button>
                    </div>
                  ))}
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

                {/* Bestehende Seiten */}
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/50 p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Vorhandene Seiten</h3>
                  <div className="space-y-3">
                    {pages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-3">
                        <div>
                          <p className="font-medium text-white">{page.title}</p>
                          <p className="text-sm text-slate-400">/{page.slug} • {page.published ? 'Veröffentlicht' : 'Entwurf'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingPage(page)}
                            className="rounded-2xl border border-blue-500/40 px-3 py-2 text-sm text-blue-300 transition hover:bg-blue-500/10"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`"${page.title}" wirklich löschen?`)) {
                                await fetch(`/api/handbook/pages?id=${page.id}`, { method: 'DELETE' });
                                await refreshData();
                              }
                            }}
                            className="rounded-2xl border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formular für neue/bearbeitete Seiten */}
                <form onSubmit={handlePageSubmit} className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {editingPage ? 'Seite bearbeiten' : 'Neue Seite erstellen'}
                    </h3>
                    {editingPage && (
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-2xl border border-slate-500/40 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-500/10"
                      >
                        Abbrechen
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Titel"
                      value={newPage.title}
                      onChange={(event) => setNewPage({ ...newPage, title: event.target.value })}
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
                          block.type === 'IMAGE' ? (
                            <div className="mt-3 space-y-3">
                              <label className="block text-sm font-medium text-slate-300">Bild aus dem Explorer auswählen</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  await handleImageUpload(index, file);
                                }}
                                className="w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none file:cursor-pointer file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:text-black"
                              />
                              {block.content ? (
                                <div className="rounded-2xl border border-white/10 bg-black/80 p-3">
                                  <img src={block.content} alt={`Handbuchbild ${index + 1}`} className="w-full object-contain rounded-2xl" />
                                  <p className="mt-2 text-sm text-slate-400">Bild wurde hochgeladen und wird beim Speichern der Seite verwendet.</p>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400">Wähle ein Bild aus und speichere die Seite. Kein Link erforderlich.</p>
                              )}
                            </div>
                          ) : (
                            <textarea
                              rows={4}
                              value={block.content}
                              onChange={(event) => handleBlockChange(index, 'content', event.target.value)}
                              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none"
                              placeholder={block.type === 'VIDEO' ? 'Embed-Link einfügen' : 'HTML-Inhalt einfügen'}
                            />
                          )
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

            {trainingModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-surface p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      {trainingModalMode === 'add'
                        ? `${modalCategory === 'fortbildung' ? 'Fortbildung' : 'Ausbildung'} hinzufügen`
                        : trainingModalMode === 'edit'
                        ? `${modalCategory === 'fortbildung' ? 'Fortbildung' : 'Ausbildung'} bearbeiten`
                        : `${modalCategory === 'fortbildung' ? 'Fortbildung' : 'Ausbildung'} löschen`}
                    </h3>
                    <button onClick={() => setTrainingModalOpen(false)} className="text-slate-300 hover:text-white">Schließen</button>
                  </div>
                  <div className="mt-6 space-y-4">
                    {(trainingModalMode === 'add' || trainingModalMode === 'edit') && (
                      <input
                        value={trainingModalTitle}
                        onChange={(event) => setTrainingModalTitle(event.target.value)}
                        placeholder={modalCategory === 'fortbildung' ? 'Fortbildungsname' : 'Ausbildungsname'}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                      />
                    )}
                    {trainingModalMode === 'delete' && (
                      <p className="text-slate-300">Möchtest du die {modalCategory === 'fortbildung' ? 'Fortbildung' : 'Ausbildung'} "{trainingModalOriginalTitle}" wirklich löschen?</p>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => setTrainingModalOpen(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5">Abbrechen</button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (trainingModalMode === 'add') {
                            if (!trainingModalTitle.trim()) return;
                            await fetch('/api/trainings/manage', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title: trainingModalTitle, category: modalCategory === 'fortbildung' ? 'FORTBILDUNG' : 'AUSBILDUNG' }),
                            });
                          }
                          if (trainingModalMode === 'edit') {
                            if (!trainingModalTitle.trim()) return;
                            await fetch('/api/trainings/manage', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ oldTitle: trainingModalOriginalTitle, newTitle: trainingModalTitle, category: modalCategory === 'fortbildung' ? 'FORTBILDUNG' : 'AUSBILDUNG' }),
                            });
                          }
                          if (trainingModalMode === 'delete') {
                            await fetch('/api/trainings/manage', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title: trainingModalOriginalTitle, category: modalCategory === 'fortbildung' ? 'FORTBILDUNG' : 'AUSBILDUNG' }),
                            });
                          }
                          setTrainingModalOpen(false);
                          await refreshData();
                        }}
                        className="rounded-2xl bg-orange-500 px-4 py-3 text-black text-sm transition hover:bg-orange-400"
                      >
                        {trainingModalMode === 'delete' ? 'Löschen' : 'Speichern'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {dutyModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-surface p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Dienstzeit eintragen</h3>
                    <button onClick={() => setDutyModalOpen(false)} className="text-slate-300 hover:text-white">Schließen</button>
                  </div>
                  <form className="mt-6 grid gap-4" onSubmit={async (event) => {
                    event.preventDefault();
                    await handleDutySubmit(event as any);
                    setDutyModalOpen(false);
                  }}>
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
                      <input
                        type="number"
                        min="0"
                        value={dutyForm.hours}
                        onChange={(event) => setDutyForm({ ...dutyForm, hours: event.target.value })}
                        className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                        placeholder="Stunden"
                        disabled={dutyForm.isVacation}
                      />
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
                    <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-slate-300">
                      <input
                        type="checkbox"
                        checked={dutyForm.isVacation}
                        onChange={(event) => setDutyForm({ ...dutyForm, isVacation: event.target.checked })}
                        className="h-4 w-4 rounded border-white/10 bg-black/70 text-orange-500"
                      />
                      Urlaub
                    </label>
                    <button className="rounded-2xl bg-orange-500 px-5 py-3 text-black transition hover:bg-orange-400">Speichern</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
