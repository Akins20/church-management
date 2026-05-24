'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderPlusIcon,
  HashtagIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  StarIcon,
  SwatchIcon,
  TrashIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  StarIcon as StarSolid,
  FolderIcon as FolderSolid,
  MapPinIcon as MapPinSolid,
} from '@heroicons/react/24/solid';
import {
  noteService,
  folderService,
  type Note,
  type NoteFilters,
  type FolderNode,
} from '@/services';

const ITEMS_PER_PAGE = 20;

const COLOR_PALETTE = [
  { name: 'None', value: null, swatch: 'bg-gray-200' },
  { name: 'Red', value: '#fca5a5', swatch: 'bg-red-300' },
  { name: 'Orange', value: '#fdba74', swatch: 'bg-orange-300' },
  { name: 'Yellow', value: '#fde68a', swatch: 'bg-yellow-200' },
  { name: 'Green', value: '#86efac', swatch: 'bg-green-300' },
  { name: 'Blue', value: '#93c5fd', swatch: 'bg-blue-300' },
  { name: 'Purple', value: '#c4b5fd', swatch: 'bg-purple-300' },
  { name: 'Pink', value: '#f9a8d4', swatch: 'bg-pink-300' },
];

type FilterMode = 'all' | 'pinned' | 'favorites' | 'archived' | 'deleted';

interface EditorState {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  isDeleted: boolean;
  color: string | null;
  tags: string[];
}

const EMPTY_EDITOR: EditorState = {
  id: '',
  title: '',
  content: '',
  folderId: null,
  isPinned: false,
  isArchived: false,
  isFavorite: false,
  isDeleted: false,
  color: null,
  tags: [],
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Flatten a folder tree into (node, depth) pairs for display. */
const flattenTree = (
  nodes: FolderNode[],
  depth = 0
): Array<{ node: FolderNode; depth: number }> => {
  const out: Array<{ node: FolderNode; depth: number }> = [];
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length) out.push(...flattenTree(node.children, depth + 1));
  }
  return out;
};

export default function NotepadNotesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') as FilterMode | null;
  const initialFilterMode: FilterMode = ['pinned', 'favorites', 'archived', 'deleted'].includes(initialView ?? '')
    ? (initialView as FilterMode)
    : 'all';

  // --- View state ---
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'root' | null>(null); // null = "All"
  const [filterMode, setFilterMode] = useState<FilterMode>(initialFilterMode);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [creatingFolderUnder, setCreatingFolderUnder] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMovePicker, setShowMovePicker] = useState(false);

  // --- Layout state: 2 columns (list + editor) with a folder drawer ---
  const [showFolders, setShowFolders] = useState(false); // folder drawer (iOS/macOS style)
  const [listWidth, setListWidth] = useState(340); // resizable list column (desktop)
  const [dirty, setDirty] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('notepadListWidth');
      if (raw) {
        const v = parseInt(raw, 10);
        if (!Number.isNaN(v)) setListWidth(Math.min(600, Math.max(260, v)));
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('notepadListWidth', String(listWidth));
    } catch {
      /* ignore */
    }
  }, [listWidth]);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startW: listWidth };
      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const next = resizeRef.current.startW + (ev.clientX - resizeRef.current.startX);
        setListWidth(Math.min(600, Math.max(260, next)));
      };
      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [listWidth]
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedFolderId, filterMode, debouncedSearch]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 2500);
  }, []);

  // --- Queries ---
  const { data: folderTree = [] } = useQuery({
    queryKey: ['folders', 'tree'],
    queryFn: () => folderService.listTree(),
  });

  const currentFilters = useMemo<NoteFilters>(() => {
    const f: NoteFilters = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (filterMode === 'deleted') {
      f.deleted = true;
    } else {
      if (filterMode === 'pinned') f.pinned = true;
      if (filterMode === 'favorites') f.favorite = true;
      if (filterMode === 'archived') f.archived = true;
      if (selectedFolderId === 'root') f.folderId = 'root';
      else if (selectedFolderId) f.folderId = selectedFolderId;
    }
    return f;
  }, [debouncedSearch, filterMode, selectedFolderId]);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', currentFilters, page],
    queryFn: () => noteService.getNotes(currentFilters, page, ITEMS_PER_PAGE),
  });
  const notes = data?.notes ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const { data: availableTags = [] } = useQuery({
    queryKey: ['notes', 'tags'],
    queryFn: () => noteService.listTags(),
  });

  // --- Mutations ---
  const invalidateNotes = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders', 'tree'] });
  };

  const saveMut = useMutation({
    mutationFn: async (payload: { id?: string; state: EditorState }) => {
      const base = {
        title: payload.state.title,
        content: payload.state.content,
        folderId: payload.state.folderId,
        isPinned: payload.state.isPinned,
        isFavorite: payload.state.isFavorite,
        color: payload.state.color,
        tags: payload.state.tags,
      };
      return payload.id
        ? noteService.updateNote(payload.id, base)
        : noteService.createNote(base);
    },
    onSuccess: (note) => {
      invalidateNotes();
      setLastSaved(new Date());
      setIsSaving(false);
      setDirty(false);
      setEditor((prev) => ({ ...prev, id: note._id }));
    },
    onError: () => {
      setIsSaving(false);
      showToast('error', 'Failed to save note');
    },
  });

  const togglePinMut = useMutation({
    mutationFn: (id: string) => noteService.togglePin(id),
    onSuccess: (note) => {
      invalidateNotes();
      if (editor.id === note._id) setEditor((prev) => ({ ...prev, isPinned: note.isPinned }));
    },
  });
  const toggleFavMut = useMutation({
    mutationFn: (id: string) => noteService.toggleFavorite(id),
    onSuccess: (note) => {
      invalidateNotes();
      if (editor.id === note._id) setEditor((prev) => ({ ...prev, isFavorite: note.isFavorite }));
    },
  });
  const toggleArchiveMut = useMutation({
    mutationFn: (id: string) => noteService.toggleArchive(id),
    onSuccess: (note) => {
      invalidateNotes();
      if (editor.id === note._id) setEditor((prev) => ({ ...prev, isArchived: note.isArchived }));
      showToast('success', note.isArchived ? 'Note archived' : 'Note unarchived');
    },
  });
  const moveMut = useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      noteService.moveNote(id, folderId),
    onSuccess: (note) => {
      invalidateNotes();
      if (editor.id === note._id) setEditor((prev) => ({ ...prev, folderId: note.folderId }));
      showToast('success', 'Note moved');
      setShowMovePicker(false);
    },
  });
  const softDeleteMut = useMutation({
    mutationFn: (id: string) => noteService.deleteNote(id),
    onSuccess: () => {
      invalidateNotes();
      showToast('success', 'Moved to Recently Deleted');
      resetEditor();
    },
  });
  const restoreMut = useMutation({
    mutationFn: (id: string) => noteService.restoreNote(id),
    onSuccess: () => {
      invalidateNotes();
      showToast('success', 'Note restored');
      resetEditor();
    },
  });
  const permanentMut = useMutation({
    mutationFn: (id: string) => noteService.permanentDelete(id),
    onSuccess: () => {
      invalidateNotes();
      showToast('success', 'Note permanently deleted');
      resetEditor();
    },
  });

  const createFolderMut = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
      folderService.create({ name, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', 'tree'] });
      setCreatingFolderUnder(undefined);
      setNewFolderName('');
      showToast('success', 'Folder created');
    },
    onError: () => showToast('error', 'Could not create folder'),
  });
  const renameFolderMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      folderService.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', 'tree'] });
      setRenamingFolderId(null);
      setRenameFolderValue('');
    },
  });
  const deleteFolderMut = useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade: 'move-to-root' | 'delete-contents' }) =>
      folderService.delete(id, cascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', 'tree'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showToast('success', 'Folder deleted');
      if (selectedFolderId && selectedFolderId !== 'root') {
        const stillExists = flatFolders.some((f) => f.node._id === selectedFolderId);
        if (!stillExists) setSelectedFolderId(null);
      }
    },
  });

  const flatFolders = useMemo(() => flattenTree(folderTree), [folderTree]);

  // --- Editor helpers ---
  function resetEditor() {
    setEditor(EMPTY_EDITOR);
    setIsEditing(false);
    setLastSaved(null);
    setShowColorPicker(false);
    setShowMovePicker(false);
    setTagInput('');
    setDirty(false);
  }

  function openNote(note: Note) {
    setEditor({
      id: note._id,
      title: note.title,
      content: note.content || '',
      folderId: note.folderId,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      isFavorite: note.isFavorite,
      isDeleted: note.isDeleted,
      color: note.color ?? null,
      tags: note.tags || [],
    });
    setIsEditing(true);
    setLastSaved(new Date(note.updatedAt));
    setDirty(false);
  }

  function openNew() {
    setEditor({
      ...EMPTY_EDITOR,
      folderId: selectedFolderId && selectedFolderId !== 'root' ? selectedFolderId : null,
    });
    setIsEditing(true);
    setLastSaved(null);
    setDirty(false);
  }

  // Auto-save (debounced) when editing
  useEffect(() => {
    if (!isEditing || !editor.title.trim() || editor.isDeleted) return;
    const t = setTimeout(() => {
      if (!editor.title.trim()) return;
      setIsSaving(true);
      saveMut.mutate({ id: editor.id || undefined, state: editor });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.title, editor.content, editor.folderId, editor.color, JSON.stringify(editor.tags)]);

  // --- Tag handling inside editor ---
  function addTag(raw: string) {
    const t = raw.trim().replace(/,$/, '').trim();
    if (!t) return;
    if (editor.tags.includes(t)) return;
    if (editor.tags.length >= 32) return;
    setEditor((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    setDirty(true);
  }
  function removeTag(t: string) {
    setEditor((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));
    setDirty(true);
  }

  // --- Signature ---
  const [showSignature, setShowSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(e);
  }, [getCanvasPoint]);
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const point = getCanvasPoint(e);
    if (!ctx || !point || !lastPointRef.current) return;
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPointRef.current = point;
  }, [getCanvasPoint]);
  const stopDrawing = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  }, []);
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureDataUrl('');
  }, []);
  useEffect(() => {
    if (showSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    }
  }, [showSignature]);

  // Resolve a folder id to its display name / color (for the always-visible folder badge)
  const folderNameOf = useCallback(
    (id: string | null | undefined) =>
      id ? flatFolders.find((f) => f.node._id === id)?.node.name ?? 'Folder' : 'Unfiled',
    [flatFolders]
  );
  const folderColorOf = useCallback(
    (id: string | null | undefined) =>
      id ? flatFolders.find((f) => f.node._id === id)?.node.color ?? null : null,
    [flatFolders]
  );

  const filterTabs: Array<{ id: FilterMode; label: string; icon: any }> = [
    { id: 'all', label: 'All Notes', icon: DocumentTextIcon },
    { id: 'pinned', label: 'Pinned', icon: MapPinIcon },
    { id: 'favorites', label: 'Favorites', icon: StarSolid },
    { id: 'archived', label: 'Archived', icon: ArchiveBoxIcon },
    { id: 'deleted', label: 'Recently Deleted', icon: TrashIcon },
  ];

  const currentFolder =
    typeof selectedFolderId === 'string' && selectedFolderId !== 'root'
      ? flatFolders.find((f) => f.node._id === selectedFolderId)?.node
      : null;

  // The label shown in the list header / folder drawer button ("denote folder at every point")
  const contextLabel = currentFolder
    ? currentFolder.name
    : selectedFolderId === 'root'
    ? 'Unfiled'
    : filterTabs.find((t) => t.id === filterMode)?.label ?? 'All Notes';

  // Show a per-note folder chip whenever we're NOT inside one specific folder
  const showFolderChip = !(typeof selectedFolderId === 'string' && selectedFolderId !== 'root');

  // Obvious save status for the editor
  const saveStatus: 'saving' | 'unsaved' | 'saved' | 'new' =
    isSaving || saveMut.isPending
      ? 'saving'
      : dirty
      ? 'unsaved'
      : lastSaved
      ? 'saved'
      : 'new';

  const selectFolder = (id: string | 'root' | null) => {
    setSelectedFolderId(id);
    if (filterMode === 'deleted') setFilterMode('all');
    else if (id !== null) setFilterMode('all');
    setShowFolders(false);
  };
  const selectFilter = (id: FilterMode) => {
    setFilterMode(id);
    if (id !== 'all') setSelectedFolderId(null);
    setShowFolders(false);
  };

  // --- Render ---
  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {notification && (
        <div
          className={`px-4 py-2.5 flex items-center justify-between shrink-0 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex items-center space-x-2 text-white text-sm font-medium">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ============ COLUMN 1: NOTE LIST ============ */}
        <section
          style={isDesktop ? { width: listWidth } : undefined}
          className={`w-full shrink-0 border-r border-gray-200 bg-white flex-col ${
            isEditing ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List header — folder context lives here at all times */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-200 shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFolders(true)}
                className="flex items-center gap-1.5 min-w-0 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-800"
                title="Browse folders"
              >
                <FolderSolid
                  className="w-4 h-4 shrink-0 text-blue-500"
                  style={currentFolder?.color ? { color: currentFolder.color } : {}}
                />
                <span className="font-semibold text-sm md:text-base truncate max-w-[160px]">
                  {contextLabel}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
              <span className="text-xs text-gray-400">{total}</span>
              <button
                onClick={openNew}
                disabled={filterMode === 'deleted'}
                className="ml-auto flex items-center px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm shrink-0"
              >
                <PlusIcon className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <DocumentTextIcon className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No notes here</p>
                {filterMode === 'deleted' && (
                  <p className="text-gray-400 text-xs mt-1">Deleted notes will show up here</p>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notes.map((note) => {
                  const chipColor = folderColorOf(note.folderId);
                  return (
                    <li key={note._id}>
                      <button
                        onClick={() => openNote(note)}
                        className={`w-full text-left px-4 py-3 transition-colors flex gap-2 ${
                          editor.id === note._id
                            ? 'bg-blue-50 dark:bg-blue-500/25'
                            : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                        }`}
                        style={{
                          borderLeft: `4px solid ${
                            editor.id === note._id ? '#3b82f6' : note.color || 'transparent'
                          }`,
                          backgroundColor:
                            editor.id === note._id
                              ? undefined
                              : note.color
                              ? `${note.color}1a`
                              : undefined,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p className="flex-1 min-w-0 font-medium text-gray-900 text-sm truncate">
                              {note.title || 'Untitled'}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {note.isPinned && <MapPinSolid className="w-3.5 h-3.5 text-amber-500" />}
                              {note.isFavorite && <StarSolid className="w-3.5 h-3.5 text-pink-500" />}
                              {note.isArchived && <ArchiveBoxIcon className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {note.content?.substring(0, 100) || 'No content'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 flex-wrap">
                            <span>{formatDate(note.updatedAt)}</span>
                            {/* Folder chip — folder denoted on every note */}
                            {showFolderChip && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                                <FolderIcon
                                  className="w-3 h-3"
                                  style={chipColor ? { color: chipColor } : {}}
                                />
                                {folderNameOf(note.folderId)}
                              </span>
                            )}
                            {note.tags?.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {note.tags.slice(0, 2).map((t) => (
                                  <span key={t} className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                                    #{t}
                                  </span>
                                ))}
                                {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between shrink-0">
              <p className="text-xs text-gray-500">Page {page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Resize handle between list and editor (desktop) */}
        <div
          onMouseDown={startResize}
          className="hidden md:block w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-300 active:bg-blue-400 transition-colors"
          title="Drag to resize"
        />

        {/* ============ COLUMN 2: EDITOR ============ */}
        <section className={`flex-1 flex flex-col min-w-0 ${!isEditing ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 flex flex-col bg-white min-h-0">
            {isEditing ? (
              <>
                {/* Color accent strip — shows the note's color while editing */}
                {editor.color && (
                  <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: editor.color }} />
                )}
                {/* Editor toolbar */}
                <div className="px-3 md:px-4 py-2 border-b border-gray-200 flex items-center gap-1 flex-wrap shrink-0">
                  {/* Back (mobile) */}
                  <button
                    onClick={resetEditor}
                    className="mr-1 p-2 -ml-1 rounded-lg hover:bg-gray-100 md:hidden"
                    title="Back to list"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                  </button>

                  {editor.isDeleted ? (
                    <>
                      <button
                        onClick={() => editor.id && restoreMut.mutate(editor.id)}
                        className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                      >
                        <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          if (editor.id && window.confirm('Permanently delete this note? This cannot be undone.'))
                            permanentMut.mutate(editor.id);
                        }}
                        className="flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                      >
                        <TrashIcon className="w-4 h-4 mr-1.5" />
                        Delete Forever
                      </button>
                    </>
                  ) : (
                    <>
                      <ToolbarButton
                        active={editor.isPinned}
                        onClick={() => editor.id && togglePinMut.mutate(editor.id)}
                        disabled={!editor.id}
                        title={editor.isPinned ? 'Unpin' : 'Pin'}
                        ActiveIcon={MapPinSolid}
                        Icon={MapPinIcon}
                        activeColor="text-amber-500"
                      />
                      <ToolbarButton
                        active={editor.isFavorite}
                        onClick={() => editor.id && toggleFavMut.mutate(editor.id)}
                        disabled={!editor.id}
                        title={editor.isFavorite ? 'Unfavorite' : 'Favorite'}
                        ActiveIcon={StarSolid}
                        Icon={StarIcon}
                        activeColor="text-pink-500"
                      />
                      <ToolbarButton
                        active={editor.isArchived}
                        onClick={() => editor.id && toggleArchiveMut.mutate(editor.id)}
                        disabled={!editor.id}
                        title={editor.isArchived ? 'Unarchive' : 'Archive'}
                        ActiveIcon={ArchiveBoxIcon}
                        Icon={ArchiveBoxIcon}
                        activeColor="text-blue-500"
                      />

                      <div className="w-px h-6 bg-gray-200 mx-1" />

                      {/* Color */}
                      <div className="relative">
                        <button
                          onClick={() => setShowColorPicker((s) => !s)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                          title="Color"
                        >
                          {editor.color ? (
                            <span
                              className="w-4 h-4 rounded-full ring-1 ring-black/10"
                              style={{ backgroundColor: editor.color }}
                            />
                          ) : (
                            <SwatchIcon className="w-4 h-4" />
                          )}
                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                        </button>
                        {showColorPicker && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
                            <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                Color
                              </p>
                              <div className="grid grid-cols-4 gap-2.5">
                                {COLOR_PALETTE.map((c) => {
                                  const selected = editor.color === c.value;
                                  return (
                                    <button
                                      key={c.name}
                                      onClick={() => {
                                        setEditor((prev) => ({ ...prev, color: c.value }));
                                        setDirty(true);
                                        setShowColorPicker(false);
                                      }}
                                      title={c.name}
                                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                                        selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                                      }`}
                                      style={c.value ? { backgroundColor: c.value } : undefined}
                                    >
                                      {c.value === null ? (
                                        <span className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400">
                                          <XMarkIcon className="w-4 h-4" />
                                        </span>
                                      ) : (
                                        selected && <CheckIcon className="w-4 h-4 text-gray-900/70" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Prominent save status pill */}
                      <SaveStatusPill status={saveStatus} lastSaved={lastSaved} />

                      <div className="flex-1" />

                      {editor.id && (
                        <button
                          onClick={() => softDeleteMut.mutate(editor.id)}
                          className="flex items-center px-2 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
                          title="Move to Recently Deleted"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Folder breadcrumb — folder denoted in the editor at all times */}
                <div className="px-4 pt-3 shrink-0">
                  <div className="relative inline-block">
                    <button
                      onClick={() => !editor.isDeleted && setShowMovePicker((s) => !s)}
                      disabled={editor.isDeleted}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 disabled:opacity-60"
                      title="Move to folder"
                    >
                      <FolderIcon
                        className="w-3.5 h-3.5"
                        style={folderColorOf(editor.folderId) ? { color: folderColorOf(editor.folderId)! } : {}}
                      />
                      {folderNameOf(editor.folderId)}
                      {!editor.isDeleted && <ChevronDownIcon className="w-3 h-3 text-gray-500" />}
                    </button>
                    {showMovePicker && !editor.isDeleted && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                        <button
                          onClick={() => {
                            if (editor.id) moveMut.mutate({ id: editor.id, folderId: null });
                            else {
                              setEditor((prev) => ({ ...prev, folderId: null }));
                              setDirty(true);
                              setShowMovePicker(false);
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                        >
                          <FolderIcon className="w-4 h-4 mr-2" /> Unfiled
                        </button>
                        {flatFolders.map(({ node, depth }) => (
                          <button
                            key={node._id}
                            onClick={() => {
                              if (editor.id) moveMut.mutate({ id: editor.id, folderId: node._id });
                              else {
                                setEditor((prev) => ({ ...prev, folderId: node._id }));
                                setDirty(true);
                                setShowMovePicker(false);
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                            style={{ paddingLeft: 12 + depth * 12 }}
                          >
                            <FolderIcon className="w-4 h-4 mr-2" />
                            {node.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="px-4 pt-2 shrink-0">
                  <input
                    type="text"
                    value={editor.title}
                    onChange={(e) => {
                      setEditor((prev) => ({ ...prev, title: e.target.value }));
                      setDirty(true);
                    }}
                    placeholder="Note title..."
                    disabled={editor.isDeleted}
                    className="w-full text-lg md:text-2xl font-bold text-gray-900 border-0 focus:outline-none placeholder-gray-400 bg-transparent disabled:text-gray-500"
                  />
                </div>

                {/* Tags */}
                <div className="px-4 pt-2 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <HashtagIcon className="w-4 h-4 text-gray-400" />
                    {editor.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs"
                      >
                        #{t}
                        {!editor.isDeleted && (
                          <button onClick={() => removeTag(t)} className="ml-1 hover:text-blue-900">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {!editor.isDeleted && (
                      <input
                        list="available-tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addTag(tagInput);
                            setTagInput('');
                          } else if (e.key === 'Backspace' && !tagInput && editor.tags.length) {
                            removeTag(editor.tags[editor.tags.length - 1]);
                          }
                        }}
                        placeholder={editor.tags.length ? 'Add tag…' : 'Add tags (press Enter)'}
                        className="text-xs outline-none border-b border-transparent focus:border-gray-300 min-w-[120px]"
                      />
                    )}
                    <datalist id="available-tags">
                      {availableTags.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 px-4 py-3 min-h-0 flex flex-col">
                  <textarea
                    value={editor.content}
                    onChange={(e) => {
                      setEditor((prev) => ({ ...prev, content: e.target.value }));
                      setDirty(true);
                    }}
                    placeholder="Start writing your note..."
                    disabled={editor.isDeleted}
                    className="w-full flex-1 p-0 border-0 focus:outline-none text-gray-900 placeholder-gray-400 resize-none text-sm bg-transparent disabled:text-gray-500"
                  />

                  {/* Signature */}
                  {!editor.isDeleted && (
                    <div className="border-t border-gray-100 pt-3 mt-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignature(!showSignature);
                          if (showSignature) clearSignature();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5 mr-1" />
                        {showSignature ? 'Hide Signature' : 'Add Signature'}
                      </button>
                      {showSignature && (
                        <div className="mt-2">
                          <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-white">
                            <canvas
                              ref={canvasRef}
                              className="w-full h-28 md:h-32 cursor-crosshair touch-none"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                            />
                            {!signatureDataUrl && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-gray-300 text-sm">Draw your signature here</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-[10px] text-gray-400">Use mouse or finger to draw</p>
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="text-[10px] text-red-500 hover:text-red-600 font-medium"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 shrink-0 flex items-center justify-between gap-3">
                  <SaveStatusPill status={saveStatus} lastSaved={lastSaved} variant="full" />
                  <button
                    onClick={() => {
                      if (!editor.title.trim()) {
                        showToast('error', 'Please enter a title');
                        return;
                      }
                      setIsSaving(true);
                      saveMut.mutate({ id: editor.id || undefined, state: editor });
                    }}
                    disabled={editor.isDeleted || saveMut.isPending}
                    className="flex items-center px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <CheckCircleSolid className="w-4 h-4 mr-1.5" />
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a note or create a new one
                </h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm">
                  Organize notes into folders, pin important ones, tag them, and find anything with search.
                </p>
                <button
                  onClick={openNew}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Note
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ============ FOLDER DRAWER (overlay) ============ */}
        {showFolders && (
          <div className="absolute inset-0 z-30 flex">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowFolders(false)}
            />
            <aside className="relative w-72 max-w-[85%] bg-white border-r border-gray-200 flex flex-col shadow-xl animate-in">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Folders</h2>
                <button
                  onClick={() => setShowFolders(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                <button
                  onClick={() => selectFolder(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center ${
                    selectedFolderId === null && filterMode === 'all'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2" /> All Notes
                </button>

                <div className="flex items-center justify-between px-2 mt-3 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Folders</span>
                  <button
                    onClick={() => {
                      setCreatingFolderUnder(null);
                      setNewFolderName('');
                    }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-500"
                    title="New folder"
                  >
                    <FolderPlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {creatingFolderUnder === null && (
                  <FolderNameInput
                    value={newFolderName}
                    onChange={setNewFolderName}
                    onSubmit={() => newFolderName.trim() && createFolderMut.mutate({ name: newFolderName.trim(), parentId: null })}
                    onCancel={() => {
                      setCreatingFolderUnder(undefined);
                      setNewFolderName('');
                    }}
                  />
                )}

                <button
                  onClick={() => selectFolder('root')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm flex items-center ${
                    selectedFolderId === 'root' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FolderIcon className="w-4 h-4 mr-2" /> Unfiled
                </button>

                {flatFolders.map(({ node, depth }) => (
                  <div key={node._id} className="group" style={{ paddingLeft: depth * 12 }}>
                    {renamingFolderId === node._id ? (
                      <FolderNameInput
                        value={renameFolderValue}
                        onChange={setRenameFolderValue}
                        onSubmit={() => renameFolderValue.trim() && renameFolderMut.mutate({ id: node._id, name: renameFolderValue.trim() })}
                        onCancel={() => setRenamingFolderId(null)}
                      />
                    ) : (
                      <div
                        className={`flex items-center rounded-lg ${
                          selectedFolderId === node._id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <button
                          onClick={() => selectFolder(node._id)}
                          className="flex-1 text-left px-3 py-1.5 text-sm flex items-center min-w-0"
                        >
                          {selectedFolderId === node._id ? (
                            <FolderSolid className="w-4 h-4 mr-2 shrink-0" style={node.color ? { color: node.color } : {}} />
                          ) : (
                            <FolderIcon className="w-4 h-4 mr-2 shrink-0" style={node.color ? { color: node.color } : {}} />
                          )}
                          <span className="truncate flex-1">{node.name}</span>
                          {node.noteCount > 0 && (
                            <span className="ml-2 text-xs text-gray-400">{node.noteCount}</span>
                          )}
                        </button>
                        <div className="hidden group-hover:flex items-center pr-1 gap-0.5 shrink-0">
                          <button
                            onClick={() => {
                              setCreatingFolderUnder(node._id);
                              setNewFolderName('');
                            }}
                            className="p-1 rounded hover:bg-white text-gray-500"
                            title="New subfolder"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRenamingFolderId(node._id);
                              setRenameFolderValue(node.name);
                            }}
                            className="p-1 rounded hover:bg-white text-gray-500"
                            title="Rename"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const opt = window.confirm(
                                `Delete "${node.name}"?\n\nOK: also delete its notes\nCancel: move notes to Unfiled`
                              );
                              deleteFolderMut.mutate({
                                id: node._id,
                                cascade: opt ? 'delete-contents' : 'move-to-root',
                              });
                            }}
                            className="p-1 rounded hover:bg-white text-red-500"
                            title="Delete folder"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {creatingFolderUnder === node._id && (
                      <div style={{ paddingLeft: 12 }}>
                        <FolderNameInput
                          value={newFolderName}
                          onChange={setNewFolderName}
                          onSubmit={() =>
                            newFolderName.trim() &&
                            createFolderMut.mutate({ name: newFolderName.trim(), parentId: node._id })
                          }
                          onCancel={() => {
                            setCreatingFolderUnder(undefined);
                            setNewFolderName('');
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {flatFolders.length === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-400">
                    No folders yet. Click the + icon to create one.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 p-3 space-y-0.5">
                {filterTabs
                  .filter((t) => t.id !== 'all')
                  .map((tab) => {
                    const Icon = tab.icon;
                    const active = filterMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => selectFilter(active ? 'all' : tab.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm flex items-center ${
                          active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </button>
                    );
                  })}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Small presentational helpers ---

function SaveStatusPill({
  status,
  lastSaved,
  variant = 'compact',
}: {
  status: 'saving' | 'unsaved' | 'saved' | 'new';
  lastSaved: Date | null;
  variant?: 'compact' | 'full';
}) {
  const map = {
    saving: { cls: 'bg-blue-50 text-blue-700', label: 'Saving…' },
    unsaved: { cls: 'bg-amber-50 text-amber-700', label: 'Unsaved changes' },
    saved: {
      cls: 'bg-green-50 text-green-700',
      label:
        variant === 'full' && lastSaved
          ? `Saved · ${lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
          : 'Saved',
    },
    new: { cls: 'bg-gray-100 text-gray-500', label: 'Not saved yet' },
  } as const;
  const { cls, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {status === 'saving' ? (
        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
      ) : status === 'saved' ? (
        <CheckCircleSolid className="w-3.5 h-3.5" />
      ) : status === 'unsaved' ? (
        <span className="w-2 h-2 rounded-full bg-amber-500" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-gray-400" />
      )}
      {label}
    </span>
  );
}

function ToolbarButton({
  active,
  onClick,
  disabled,
  title,
  Icon,
  ActiveIcon,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  Icon: any;
  ActiveIcon: any;
  activeColor: string;
}) {
  const C = active ? ActiveIcon : Icon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active ? `${activeColor} bg-gray-100` : 'text-gray-600 hover:bg-gray-100'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <C className="w-4 h-4" />
    </button>
  );
}

function FolderNameInput({
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center px-2 py-1">
      <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          else if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => {
          if (value.trim()) onSubmit();
          else onCancel();
        }}
        placeholder="Folder name"
        className="flex-1 text-sm bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 px-1"
      />
    </div>
  );
}
