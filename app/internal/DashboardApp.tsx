'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import LogoutButton from './LogoutButton';
import { toYouTubeEmbedUrl } from '@/lib/youtube';

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

type BlockColumns = 1 | 2 | 3 | 4;
type ImageSize = 'small' | 'medium' | 'large' | 'xlarge';

function parseBlockMeta(content: string): { columns: BlockColumns; imageSize: ImageSize; imageHeight: number | null; content: string } {
  let rawContent = content || '';
  let columns: BlockColumns = 4;
  let imageSize: ImageSize = 'medium';
  let imageHeight: number | null = null;

  // Alte und neue Präfixe am Anfang des Inhalts unterstützen.
  while (true) {
    const match = rawContent.match(/^\[\[([a-zA-Z]+):([^\]]+)\]\]/);
    if (!match) break;

    const [, key, value] = match;
    if (key === 'layout') {
      columns = value === 'half' ? 2 : 4;
    }
    if (key === 'cols') {
      const parsed = Number(value);
      if (parsed >= 1 && parsed <= 4) {
        columns = parsed as BlockColumns;
      }
    }
    if (key === 'imgSize' && (value === 'small' || value === 'medium' || value === 'large' || value === 'xlarge')) {
      imageSize = value;
    }
    if (key === 'imgHeight') {
      const parsedHeight = Number(value);
      if (Number.isFinite(parsedHeight) && parsedHeight >= 160 && parsedHeight <= 900) {
        imageHeight = Math.round(parsedHeight);
      }
    }

    rawContent = rawContent.slice(match[0].length);
  }

  return { columns, imageSize, imageHeight, content: rawContent };
}

function buildBlockContent(rawContent: string, columns: BlockColumns, imageSize: ImageSize, imageHeight: number | null): string {
  const cleanContent = rawContent || '';
  const prefixes: string[] = [];

  if (columns !== 4) {
    prefixes.push(`[[cols:${columns}]]`);
  }
  if (imageSize !== 'medium') {
    prefixes.push(`[[imgSize:${imageSize}]]`);
  }
  if (imageHeight !== null) {
    prefixes.push(`[[imgHeight:${imageHeight}]]`);
  }

  return `${prefixes.join('')}${cleanContent}`;
}

function getBlockRawContent(content: string): string {
  return parseBlockMeta(content).content;
}

function getBlockColumns(content: string): BlockColumns {
  return parseBlockMeta(content).columns;
}

function getBlockImageSize(content: string): ImageSize {
  return parseBlockMeta(content).imageSize;
}

function getBlockImageHeight(content: string): number | null {
  return parseBlockMeta(content).imageHeight;
}

const previewColumnClassMap: Record<BlockColumns, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
};

const previewImageHeightClassMap: Record<ImageSize, string> = {
  small: 'h-52 md:h-56',
  medium: 'h-64 md:h-72',
  large: 'h-80 md:h-96',
  xlarge: 'h-[28rem] md:h-[40rem]',
};

function simpleDate(value: string) {
  return value ? new Date(value).toISOString().split('T')[0] : '';
}

function RichHtmlEditor({
  editorId,
  value,
  onChange,
}: {
  editorId: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;

    event.preventDefault();

    if (event.shiftKey) {
      document.execCommand('outdent');
      onChange(event.currentTarget.innerHTML);
      return;
    }

    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    onChange(event.currentTarget.innerHTML);
  }

  return (
    <div
      data-block-editor={editorId}
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onInput={(event) => onChange(event.currentTarget.innerHTML)}
      className="handbook-richtext min-h-[160px] w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none"
    />
  );
}

export default function DashboardApp() {
  const [activeTab, setActiveTab] = useState<'members' | 'training' | 'duty' | 'checks' | 'handbook' | 'fortbildungen'>('members');
  const [members, setMembers] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [dutyTimes, setDutyTimes] = useState<any[]>([]);
  const [flightChecks, setFlightChecks] = useState<any[]>([]);
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
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingModalMode, setTrainingModalMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [trainingModalTitle, setTrainingModalTitle] = useState('');
  const [trainingModalOriginalTitle, setTrainingModalOriginalTitle] = useState('');
  const [dutyModalOpen, setDutyModalOpen] = useState(false);
  const [flightCheckModalOpen, setFlightCheckModalOpen] = useState(false);
  const [flightCheckModalMode, setFlightCheckModalMode] = useState<'add' | 'edit'>('add');
  const [editingFlightCheckId, setEditingFlightCheckId] = useState<string | null>(null);
  const [selectedFlightCheck, setSelectedFlightCheck] = useState<any | null>(null);
  const [flightCheckForm, setFlightCheckForm] = useState({ date: simpleDate(new Date().toISOString()), route: '', participants: [] as Array<{ memberId: string; participated: boolean; passed: boolean }> });
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<'ausbildung' | 'fortbildung'>('ausbildung');
  const [showAvailableAusbildungen, setShowAvailableAusbildungen] = useState(false);
  const [showAvailableFortbildungen, setShowAvailableFortbildungen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [membersRes, trainingsRes, dutiesRes, checksRes, pagesRes, trainingsManageRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/trainings'),
          fetch('/api/duty-times'),
          fetch('/api/flight-checks'),
          fetch('/api/handbook/pages'),
          fetch('/api/trainings/manage'),
        ]);
        setMembers(await membersRes.json());
        setTrainings(await trainingsRes.json());
        setDutyTimes(await dutiesRes.json());
        setFlightChecks(await checksRes.json());
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
  const checkEligibleMembers = useMemo(
    () => sortedMembers.filter((member) => !['Flight_Student', 'ASD_Co_Director', 'ASD_Director'].includes(member.rank)),
    [sortedMembers]
  );
  const studentMembers = useMemo(() => sortedMembers.filter((member) => member.rank === 'Flight_Student'), [sortedMembers]);
  const directorMembers = useMemo(() => sortedMembers.filter((member) => ['ASD_Director', 'ASD_Co_Director'].includes(member.rank)), [sortedMembers]);

  function buildFlightCheckParticipants() {
    return checkEligibleMembers.map((member) => ({
      memberId: member.id,
      participated: false,
      passed: false,
    }));
  }

  function openFlightCheckModal() {
    setFlightCheckModalMode('add');
    setEditingFlightCheckId(null);
    setFlightCheckForm({
      date: simpleDate(new Date().toISOString()),
      route: '',
      participants: buildFlightCheckParticipants(),
    });
    setFlightCheckModalOpen(true);
  }

  function openEditFlightCheckModal(check: any) {
    setFlightCheckModalMode('edit');
    setEditingFlightCheckId(check.id);
    setFlightCheckForm({
      date: simpleDate(check.date),
      route: check.route || '',
      participants: checkEligibleMembers.map((member) => {
        const existingParticipant = check.participants.find((participant: any) => participant.memberId === member.id);
        return {
          memberId: member.id,
          participated: Boolean(existingParticipant?.participated),
          passed: Boolean(existingParticipant?.passed),
        };
      }),
    });
    setFlightCheckModalOpen(true);
  }

  async function refreshData() {
    try {
      const [membersRes, trainingsRes, dutiesRes, checksRes, pagesRes, trainingsManageRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/trainings'),
        fetch('/api/duty-times'),
        fetch('/api/flight-checks'),
        fetch('/api/handbook/pages'),
        fetch('/api/trainings/manage'),
      ]);
      setMembers(await membersRes.json());
      setTrainings(await trainingsRes.json());
      setDutyTimes(await dutiesRes.json());
      setFlightChecks(await checksRes.json());
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

  function handleFlightCheckParticipation(memberId: string, participated: boolean) {
    setFlightCheckForm((current) => ({
      ...current,
      participants: current.participants.map((participant) => {
        if (participant.memberId !== memberId) return participant;
        return {
          ...participant,
          participated,
          passed: participated ? participant.passed : false,
        };
      }),
    }));
  }

  function handleFlightCheckPassed(memberId: string, passed: boolean) {
    setFlightCheckForm((current) => ({
      ...current,
      participants: current.participants.map((participant) => {
        if (participant.memberId !== memberId) return participant;
        return {
          ...participant,
          passed,
        };
      }),
    }));
  }

  async function handleFlightCheckSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await fetch('/api/flight-checks', {
        method: flightCheckModalMode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flightCheckForm,
          id: editingFlightCheckId,
        }),
      });
      setFlightCheckModalOpen(false);
      setEditingFlightCheckId(null);
      await refreshData();
    } catch (err) {
      setError('Flugüberprüfung konnte nicht gespeichert werden');
    }
  }

  async function handleDeleteFlightCheck(id: string) {
    if (!confirm('Flugüberprüfung wirklich löschen?')) return;
    try {
      await fetch('/api/flight-checks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await refreshData();
    } catch (err) {
      setError('Flugüberprüfung konnte nicht gelöscht werden');
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

  async function handleMoveHandbookPage(pageId: string, direction: 'up' | 'down') {
    const currentIndex = pages.findIndex((page) => page.id === pageId);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const reordered = [...pages];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];

    try {
      await fetch('/api/handbook/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageOrderIds: reordered.map((page) => page.id) }),
      });
      await refreshData();
    } catch (err) {
      setError('Seitenreihenfolge konnte nicht gespeichert werden');
    }
  }

  function handlePageDragStart(index: number) {
    setDraggedPageIndex(index);
  }

  function handlePageDragEnd() {
    setDraggedPageIndex(null);
  }

  async function handlePageDrop(targetIndex: number) {
    if (draggedPageIndex === null || draggedPageIndex === targetIndex) {
      setDraggedPageIndex(null);
      return;
    }

    const reordered = [...pages];
    const [moved] = reordered.splice(draggedPageIndex, 1);
    const insertIndex = draggedPageIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(insertIndex, 0, moved);

    try {
      await fetch('/api/handbook/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageOrderIds: reordered.map((page) => page.id) }),
      });
      await refreshData();
    } catch (err) {
      setError('Seitenreihenfolge konnte nicht gespeichert werden');
    } finally {
      setDraggedPageIndex(null);
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
    setEditorBlocks((current) =>
      current.map((block, idx) => {
        if (idx !== index) return block;
        if (key !== 'content') return { ...block, [key]: value };

        const parsedMeta = parseBlockMeta(block.content || '');
        return {
          ...block,
          content: buildBlockContent(value, parsedMeta.columns, parsedMeta.imageSize, parsedMeta.imageHeight),
        };
      })
    );
  }

  function handleBlockColumnsChange(index: number, columns: BlockColumns) {
    setEditorBlocks((current) =>
      current.map((block, idx) => {
        if (idx !== index) return block;
        const parsedMeta = parseBlockMeta(block.content || '');
        return {
          ...block,
          content: buildBlockContent(parsedMeta.content, columns, parsedMeta.imageSize, parsedMeta.imageHeight),
        };
      })
    );
  }

  function handleImageSizeChange(index: number, imageSize: ImageSize) {
    setEditorBlocks((current) =>
      current.map((block, idx) => {
        if (idx !== index) return block;
        const parsedMeta = parseBlockMeta(block.content || '');
        return {
          ...block,
          content: buildBlockContent(parsedMeta.content, parsedMeta.columns, imageSize, parsedMeta.imageHeight),
        };
      })
    );
  }

  function handleImageHeightChange(index: number, imageHeight: number | null) {
    setEditorBlocks((current) =>
      current.map((block, idx) => {
        if (idx !== index) return block;
        const parsedMeta = parseBlockMeta(block.content || '');
        return {
          ...block,
          content: buildBlockContent(parsedMeta.content, parsedMeta.columns, parsedMeta.imageSize, imageHeight),
        };
      })
    );
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    setEditorBlocks((current) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function handleBlockDragStart(index: number) {
    setDraggedBlockIndex(index);
  }

  function handleBlockDrop(targetIndex: number) {
    setEditorBlocks((current) => {
      if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) return current;
      const next = [...current];
      const [moved] = next.splice(draggedBlockIndex, 1);
      const insertIndex = draggedBlockIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(insertIndex, 0, moved);
      return next;
    });
    setDraggedBlockIndex(null);
  }

  function handleBlockDragEnd() {
    setDraggedBlockIndex(null);
  }

  function applyTextCommand(index: number, command: string, value?: string) {
    const editor = document.querySelector(`[data-block-editor="${index}"]`) as HTMLDivElement | null;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    handleBlockChange(index, 'content', editor.innerHTML);
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
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Flugüberprüfungen</h2>
                    <p className="mt-2 text-slate-400">Erstelle neue Flugüberprüfungen mit Strecke und Ergebnis pro Mitglied.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openFlightCheckModal}
                    className="rounded-2xl bg-orange-500 px-4 py-2 text-black transition hover:bg-orange-400"
                  >
                    Neue Flugüberprüfung
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  {flightChecks.length === 0 && (
                    <div className="rounded-3xl border border-white/10 bg-black/50 p-6 text-slate-300">Noch keine Flugüberprüfung vorhanden.</div>
                  )}

                  {flightChecks.map((check) => {
                    const participatedCount = check.participants.filter((participant: any) => participant.participated).length;
                    const passedCount = check.participants.filter((participant: any) => participant.passed).length;

                    return (
                      <div
                        key={check.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedFlightCheck(check)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedFlightCheck(check);
                          }
                        }}
                        className="rounded-3xl border border-white/10 bg-black/50 p-4 cursor-pointer transition hover:border-orange-400/40"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-white">{check.route}</p>
                            <p className="mt-1 text-sm text-slate-400">{new Date(check.date).toLocaleDateString('de-DE')}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditFlightCheckModal(check);
                              }}
                              className="rounded-2xl border border-blue-500/40 px-4 py-2 text-sm text-blue-300 transition hover:bg-blue-500/10"
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteFlightCheck(check.id);
                              }}
                              className="rounded-2xl border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <p className="rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-slate-300">Teilgenommen: <span className="font-semibold text-white">{participatedCount}</span></p>
                          <p className="rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-slate-300">Bestanden: <span className="font-semibold text-white">{passedCount}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {!loading && activeTab === 'handbook' && (
              <section className="rounded-3xl border border-white/10 bg-surface p-6 shadow-glow">
                <h2 className="text-2xl font-semibold">Handbuch Verwaltung</h2>
                <p className="mt-2 text-slate-400">Erstelle Seiten, bearbeite Inhalte und veröffentliche sie für den öffentlichen Bereich.</p>

                {/* Bestehende Seiten */}
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/50 p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Vorhandene Seiten</h3>
                  <p className="mb-4 text-sm text-slate-400">Seiten können per Drag-and-Drop oder mit Hoch/Runter sortiert werden.</p>
                  <div className="space-y-3">
                    {pages.map((page, index) => (
                      <div
                        key={page.id}
                        draggable
                        onDragStart={() => handlePageDragStart(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handlePageDrop(index)}
                        onDragEnd={handlePageDragEnd}
                        className={`flex items-center justify-between rounded-2xl border bg-surface p-3 ${draggedPageIndex === index ? 'border-orange-400/60' : 'border-white/10'}`}
                      >
                        <div>
                          <p className="font-medium text-white">{index + 1}. {page.title}</p>
                          <p className="text-sm text-slate-400">/{page.slug} • {page.published ? 'Veröffentlicht' : 'Entwurf'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveHandbookPage(page.id, 'up')}
                            disabled={index === 0}
                            className="rounded-2xl border border-white/20 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Hoch
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveHandbookPage(page.id, 'down')}
                            disabled={index === pages.length - 1}
                            className="rounded-2xl border border-white/20 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Runter
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditingPage(page)}
                            className="rounded-2xl border border-blue-500/40 px-3 py-2 text-sm text-blue-300 transition hover:bg-blue-500/10"
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`"${page.title}" wirklich löschen?`)) {
                                const response = await fetch('/api/handbook/pages', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: page.id }),
                                });
                                if (!response.ok) {
                                  const data = await response.json().catch(() => ({}));
                                  setError(data.error || 'Seite konnte nicht gelöscht werden');
                                  return;
                                }
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
                      <div
                        key={`${block.type}-${index}`}
                        draggable
                        onDragStart={() => handleBlockDragStart(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleBlockDrop(index)}
                        onDragEnd={handleBlockDragEnd}
                        className={`rounded-3xl border bg-black/70 p-4 ${draggedBlockIndex === index ? 'border-orange-400/60' : 'border-white/10'}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold text-white">{block.type} <span className="text-xs font-normal text-slate-400">(ziehen zum Umsortieren)</span></span>
                          <div className="flex items-center gap-2">
                            {block.type !== 'DIVIDER' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleBlockColumnsChange(index, 1)}
                                  className={`rounded-xl border px-2 py-1 text-xs transition ${getBlockColumns(block.content || '') === 1 ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  1/4
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBlockColumnsChange(index, 2)}
                                  className={`rounded-xl border px-2 py-1 text-xs transition ${getBlockColumns(block.content || '') === 2 ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  2/4
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBlockColumnsChange(index, 3)}
                                  className={`rounded-xl border px-2 py-1 text-xs transition ${getBlockColumns(block.content || '') === 3 ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  3/4
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBlockColumnsChange(index, 4)}
                                  className={`rounded-xl border px-2 py-1 text-xs transition ${getBlockColumns(block.content || '') === 4 ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  4/4
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => moveBlock(index, 'up')}
                              disabled={index === 0}
                              className="rounded-xl border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Hoch
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, 'down')}
                              disabled={index === editorBlocks.length - 1}
                              className="rounded-xl border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Runter
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditorBlocks((current) => current.filter((_, idx) => idx !== index))}
                              className="text-sm text-orange-300 hover:text-orange-100"
                            >
                              Entfernen
                            </button>
                          </div>
                        </div>
                        {block.type !== 'DIVIDER' ? (
                          block.type === 'TEXT' ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'bold')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Fett
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'italic')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Kursiv
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'underline')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Unterstrichen
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'insertOrderedList')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  1. 2. 3.
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'insertUnorderedList')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Stichpunkte
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'formatBlock', '<h1>')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Groß
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'formatBlock', '<h3>')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Mittel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'formatBlock', '<p>')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Normal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'decreaseFontSize')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Klein
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'increaseFontSize')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Größer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyTextCommand(index, 'removeFormat')}
                                  className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Format löschen
                                </button>
                              </div>
                              <RichHtmlEditor
                                editorId={String(index)}
                                value={getBlockRawContent(block.content || '')}
                                onChange={(nextValue) => handleBlockChange(index, 'content', nextValue)}
                              />
                            </div>
                          ) : block.type === 'IMAGE' ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-slate-300">Bildgröße:</span>
                                <button
                                  type="button"
                                  onClick={() => handleImageSizeChange(index, 'small')}
                                  className={`rounded-xl border px-3 py-1 text-xs transition ${getBlockImageSize(block.content || '') === 'small' ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  Klein
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImageSizeChange(index, 'medium')}
                                  className={`rounded-xl border px-3 py-1 text-xs transition ${getBlockImageSize(block.content || '') === 'medium' ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  Mittel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImageSizeChange(index, 'large')}
                                  className={`rounded-xl border px-3 py-1 text-xs transition ${getBlockImageSize(block.content || '') === 'large' ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  Groß
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImageSizeChange(index, 'xlarge')}
                                  className={`rounded-xl border px-3 py-1 text-xs transition ${getBlockImageSize(block.content || '') === 'xlarge' ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}
                                >
                                  Sehr groß
                                </button>
                              </div>
                              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm text-slate-300">Sichtbare Höhe:</span>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={160}
                                      max={900}
                                      step={10}
                                      value={getBlockImageHeight(block.content || '') ?? ''}
                                      onChange={(event) => {
                                        const nextValue = event.target.value;
                                        if (!nextValue) {
                                          handleImageHeightChange(index, null);
                                          return;
                                        }
                                        const parsed = Number(nextValue);
                                        if (Number.isFinite(parsed)) {
                                          const clamped = Math.min(900, Math.max(160, Math.round(parsed)));
                                          handleImageHeightChange(index, clamped);
                                        }
                                      }}
                                      placeholder="Auto"
                                      className="w-24 rounded-xl border border-white/10 bg-[#111] px-2 py-1 text-sm text-white outline-none"
                                    />
                                    <span className="text-xs text-slate-400">px</span>
                                    <button
                                      type="button"
                                      onClick={() => handleImageHeightChange(index, null)}
                                      className="rounded-xl border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                    >
                                      Auto
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={160}
                                  max={900}
                                  step={10}
                                  value={getBlockImageHeight(block.content || '') ?? 500}
                                  onChange={(event) => {
                                    const parsed = Number(event.target.value);
                                    const clamped = Math.min(900, Math.max(160, Math.round(parsed)));
                                    handleImageHeightChange(index, clamped);
                                  }}
                                  className="w-full accent-orange-400"
                                />
                              </div>
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
                                  <img src={getBlockRawContent(block.content || '')} alt={`Handbuchbild ${index + 1}`} className="w-full object-contain rounded-2xl" />
                                  <p className="mt-2 text-sm text-slate-400">Bild wurde hochgeladen und wird beim Speichern der Seite verwendet.</p>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400">Wähle ein Bild aus und speichere die Seite. Kein Link erforderlich.</p>
                              )}
                              {isUploadingImage && <p className="text-sm text-orange-300">Bild wird hochgeladen ...</p>}
                            </div>
                          ) : (
                            <textarea
                              rows={4}
                              value={getBlockRawContent(block.content || '')}
                              onChange={(event) => handleBlockChange(index, 'content', event.target.value)}
                              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none"
                              placeholder={block.type === 'VIDEO' ? 'YouTube-Link einfügen (z. B. https://youtu.be/...)' : 'HTML-Inhalt einfügen'}
                            />
                          )
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">Trennlinie wird ohne weiteren Inhalt dargestellt.</p>
                        )}
                        {block.type === 'VIDEO' && (
                          <p className="mt-2 text-xs text-slate-400">Normale YouTube-Links werden automatisch als eingebettetes Video angezeigt.</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="rounded-2xl bg-orange-500 px-5 py-3 text-black transition hover:bg-orange-400">Speichern</button>
                </form>

                <div className="mt-8 rounded-3xl border border-white/10 bg-black/50 p-4">
                  <h3 className="text-lg font-semibold text-white">Live-Vorschau</h3>
                  <p className="mt-1 text-sm text-slate-400">So wird die Seite aktuell dargestellt. Änderungen an Breite und Bildgröße siehst du sofort.</p>

                  <div className="mt-4 rounded-[2rem] border border-white/10 bg-surface/80 p-6">
                    <div className="border-b border-white/10 pb-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-orange-400">Handbuchseite</p>
                      <h4 className="mt-2 text-2xl font-semibold text-white">{newPage.title || 'Unbenannte Seite'}</h4>
                      {newPage.description ? <p className="mt-2 text-sm text-slate-300">{newPage.description}</p> : null}
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-4">
                      {editorBlocks.map((block, index) => {
                        const meta = parseBlockMeta(block.content || '');
                        const blockColumns: BlockColumns = block.type === 'DIVIDER' ? 4 : meta.columns;
                        const blockWidthClass = previewColumnClassMap[blockColumns];
                        const imageHeightClass = previewImageHeightClassMap[meta.imageSize];
                        const imageHeightStyle = meta.imageHeight !== null ? { height: `${meta.imageHeight}px` } : undefined;

                        if (block.type === 'TEXT') {
                          return (
                            <section key={`preview-${index}`} className={`rounded-3xl border border-white/10 bg-surface p-6 text-slate-200 shadow-sm ${blockWidthClass}`}>
                              <div className="handbook-richtext" dangerouslySetInnerHTML={{ __html: meta.content || '<p class="text-slate-400">Leerer Textblock</p>' }} />
                            </section>
                          );
                        }

                        if (block.type === 'IMAGE') {
                          return (
                            <section key={`preview-${index}`} className={`overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-sm ${blockWidthClass}`}>
                              {meta.content ? (
                                <img
                                  src={meta.content}
                                  alt={`Vorschau Bild ${index + 1}`}
                                  className={`w-full object-cover ${meta.imageHeight !== null ? '' : imageHeightClass}`}
                                  style={imageHeightStyle}
                                />
                              ) : (
                                <div
                                  className={`flex w-full items-center justify-center bg-black/40 text-sm text-slate-400 ${meta.imageHeight !== null ? '' : imageHeightClass}`}
                                  style={imageHeightStyle}
                                >
                                  Kein Bild ausgewählt
                                </div>
                              )}
                            </section>
                          );
                        }

                        if (block.type === 'VIDEO') {
                          const videoSrc = toYouTubeEmbedUrl(meta.content) || meta.content;
                          return (
                            <section key={`preview-${index}`} className={`overflow-hidden rounded-3xl border border-white/10 bg-surface p-4 shadow-sm ${blockWidthClass}`}>
                              {meta.content ? (
                                <div className="aspect-video overflow-hidden rounded-3xl bg-black">
                                  <iframe
                                    src={videoSrc}
                                    title={`Video Vorschau ${index + 1}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="h-full w-full"
                                  />
                                </div>
                              ) : (
                                <div className="flex aspect-video items-center justify-center rounded-3xl bg-black text-sm text-slate-400">
                                  Kein Video-Link hinterlegt
                                </div>
                              )}
                            </section>
                          );
                        }

                        if (block.type === 'DIVIDER') {
                          return <hr key={`preview-${index}`} className={`border-slate-700 ${blockWidthClass}`} />;
                        }

                        return null;
                      })}
                    </div>
                  </div>
                </div>

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

            {flightCheckModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-surface p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">{flightCheckModalMode === 'edit' ? 'Flugüberprüfung bearbeiten' : 'Neue Flugüberprüfung'}</h3>
                    <button onClick={() => {
                      setFlightCheckModalOpen(false);
                      setEditingFlightCheckId(null);
                    }} className="text-slate-300 hover:text-white">Schließen</button>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleFlightCheckSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="date"
                        value={flightCheckForm.date}
                        onChange={(event) => setFlightCheckForm({ ...flightCheckForm, date: event.target.value })}
                        className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={flightCheckForm.route}
                        onChange={(event) => setFlightCheckForm({ ...flightCheckForm, route: event.target.value })}
                        placeholder="Strecke"
                        className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none"
                        required
                      />
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/50">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                        <span>Mitglied</span>
                        <span>Teilgenommen</span>
                        <span>Bestanden</span>
                      </div>

                      <div className="max-h-[340px] space-y-2 overflow-y-auto p-4">
                        {flightCheckForm.participants.map((participant) => {
                          const member = checkEligibleMembers.find((candidate) => candidate.id === participant.memberId);
                          if (!member) return null;

                          return (
                            <div key={participant.memberId} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-white/10 bg-surface px-4 py-3">
                              <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-xs text-slate-400">{member.rank.replaceAll('_', ' ')}</p>
                              </div>
                              <label className="inline-flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={participant.participated}
                                  onChange={(event) => handleFlightCheckParticipation(participant.memberId, event.target.checked)}
                                  className="h-4 w-4 rounded border-white/10 bg-black/70 text-orange-500"
                                />
                              </label>
                              <label className="inline-flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={participant.passed}
                                  onChange={(event) => handleFlightCheckPassed(participant.memberId, event.target.checked)}
                                  className="h-4 w-4 rounded border-white/10 bg-black/70 text-orange-500"
                                  disabled={!participant.participated}
                                />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => {
                        setFlightCheckModalOpen(false);
                        setEditingFlightCheckId(null);
                      }} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5">Abbrechen</button>
                      <button className="rounded-2xl bg-orange-500 px-5 py-3 text-black transition hover:bg-orange-400">{flightCheckModalMode === 'edit' ? 'Aktualisieren' : 'Speichern'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {selectedFlightCheck && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-surface p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedFlightCheck.route}</h3>
                      <p className="mt-1 text-sm text-slate-400">{new Date(selectedFlightCheck.date).toLocaleDateString('de-DE')}</p>
                    </div>
                    <button onClick={() => setSelectedFlightCheck(null)} className="text-slate-300 hover:text-white">Schließen</button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <p className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-slate-300">
                      Teilgenommen: <span className="font-semibold text-white">{selectedFlightCheck.participants.filter((participant: any) => participant.participated).length}</span>
                    </p>
                    <p className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-slate-300">
                      Bestanden: <span className="font-semibold text-white">{selectedFlightCheck.participants.filter((participant: any) => participant.passed).length}</span>
                    </p>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/50">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <span>Mitglied</span>
                      <span>Teilgenommen</span>
                      <span>Bestanden</span>
                    </div>
                    <div className="max-h-[360px] space-y-2 overflow-y-auto p-4">
                      {selectedFlightCheck.participants
                        .sort((a: any, b: any) => a.member.name.localeCompare(b.member.name, 'de-DE'))
                        .map((participant: any) => (
                          <div key={participant.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-white/10 bg-surface px-4 py-3">
                            <div>
                              <p className="font-medium text-white">{participant.member.name}</p>
                              <p className="text-xs text-slate-400">{participant.member.rank.replaceAll('_', ' ')}</p>
                            </div>
                            <span className={`text-sm ${participant.participated ? 'text-green-300' : 'text-slate-500'}`}>{participant.participated ? 'Ja' : 'Nein'}</span>
                            <span className={`text-sm ${participant.passed ? 'text-green-300' : 'text-slate-500'}`}>{participant.passed ? 'Ja' : 'Nein'}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
