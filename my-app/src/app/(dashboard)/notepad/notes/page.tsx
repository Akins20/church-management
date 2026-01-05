'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '@/services';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  TrashIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const ITEMS_PER_PAGE = 6;

export default function NotepadNotesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [currentNote, setCurrentNote] = useState({
    id: '',
    title: '',
    content: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch notes with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['notes', page],
    queryFn: () => noteService.getNotes({}, page, ITEMS_PER_PAGE),
  });

  const notes = data?.notes || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (note: { id?: string; title: string; content: string }) => {
      if (note.id) {
        return noteService.updateNote(note.id, { title: note.title, content: note.content });
      } else {
        return noteService.createNote({ title: note.title, content: note.content });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setLastSaved(new Date());
      setIsSaving(false);
      if (!currentNote.id && data?._id) {
        setCurrentNote((prev) => ({ ...prev, id: data._id }));
      }
    },
    onError: () => {
      setIsSaving(false);
      setNotification({ type: 'error', message: 'Failed to save note' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => noteService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setCurrentNote({ id: '', title: '', content: '' });
      setIsEditing(false);
      setNotification({ type: 'success', message: 'Note deleted successfully' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to delete note' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (!isEditing || !currentNote.title.trim()) return;

    const timer = setTimeout(() => {
      if (currentNote.title.trim()) {
        setIsSaving(true);
        saveNoteMutation.mutate({
          id: currentNote.id || undefined,
          title: currentNote.title,
          content: currentNote.content,
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentNote.title, currentNote.content, isEditing]);

  const handleNewNote = () => {
    setCurrentNote({ id: '', title: '', content: '' });
    setIsEditing(true);
    setLastSaved(null);
  };

  const handleSelectNote = (note: any) => {
    setCurrentNote({
      id: note._id,
      title: note.title,
      content: note.content || '',
    });
    setIsEditing(true);
    setLastSaved(new Date(note.updatedAt));
  };

  const handleBack = () => {
    setIsEditing(false);
    setCurrentNote({ id: '', title: '', content: '' });
  };

  const handleSave = () => {
    if (!currentNote.title.trim()) {
      setNotification({ type: 'error', message: 'Please enter a title for your note' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsSaving(true);
    saveNoteMutation.mutate({
      id: currentNote.id || undefined,
      title: currentNote.title,
      content: currentNote.content,
    });
    setNotification({ type: 'success', message: 'Note saved successfully' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = () => {
    if (currentNote.id && confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(currentNote.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Notification */}
      {notification && (
        <div
          className={`px-4 py-3 flex items-center justify-between shrink-0 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex items-center space-x-2 text-white">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Back button on mobile when editing */}
            {isEditing && (
              <button
                onClick={handleBack}
                className="mr-3 p-2 -ml-2 rounded-xl hover:bg-gray-100 lg:hidden"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notes</h1>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden sm:block">Create and manage your notes</p>
            </div>
          </div>
          <button
            onClick={handleNewNote}
            className="flex items-center px-3 md:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">New Note</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-4 md:p-6 gap-4">
        {/* Notes List - Hidden on mobile when editing */}
        <div className={`lg:w-72 flex flex-col shrink-0 ${isEditing ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-white rounded-2xl border border-gray-200 flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Your Notes</h2>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {total}
                </span>
              </div>
            </div>

            <div className="flex-1 p-4 min-h-0 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No notes yet</p>
                  <p className="text-gray-400 text-xs mt-1">Click "New Note" to create one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div
                      key={note._id}
                      onClick={() => handleSelectNote(note)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        currentNote.id === note._id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {note.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {note.content?.substring(0, 40) || 'No content'}...
                          </p>
                        </div>
                        <DocumentTextIcon className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                      </div>
                      <div className="flex items-center mt-2 text-[10px] text-gray-400">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {formatDate(note.updatedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Page {page}/{totalPages}
                  </p>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note Editor - Full width on mobile when editing */}
        <div className={`flex-1 flex flex-col min-w-0 ${!isEditing ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-white rounded-2xl border border-gray-200 flex-1 flex flex-col">
            {isEditing ? (
              <>
                {/* Editor Header */}
                <div className="p-4 border-b border-gray-200 shrink-0">
                  <input
                    type="text"
                    value={currentNote.title}
                    onChange={(e) => setCurrentNote((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Note title..."
                    className="w-full text-lg md:text-xl font-bold text-gray-900 border-0 focus:outline-none placeholder-gray-400"
                  />
                </div>

                {/* Editor Content */}
                <div className="flex-1 p-4 min-h-0">
                  <textarea
                    value={currentNote.content}
                    onChange={(e) => setCurrentNote((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Start writing your note..."
                    className="w-full h-full p-0 border-0 focus:outline-none text-gray-900 placeholder-gray-400 resize-none text-sm"
                  />
                </div>

                {/* Editor Footer */}
                <div className="p-3 md:p-4 border-t border-gray-200 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center text-xs md:text-sm text-gray-500">
                      {isSaving || saveNoteMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : lastSaved ? (
                        <>
                          <CheckCircleSolid className="w-4 h-4 mr-1.5 text-green-500" />
                          <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>
                          <span className="sm:hidden">Saved</span>
                        </>
                      ) : (
                        <>
                          <DocumentTextIcon className="w-4 h-4 mr-1.5" />
                          Editing...
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {currentNote.id && (
                        <button
                          onClick={handleDelete}
                          disabled={deleteNoteMutation.isPending}
                          className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm disabled:opacity-50"
                        >
                          <TrashIcon className="w-4 h-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={saveNoteMutation.isPending}
                        className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
                      >
                        <CheckCircleSolid className="w-4 h-4 mr-1.5" />
                        Save
                      </button>
                    </div>
                  </div>
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
                <p className="text-gray-500 text-sm mb-6">
                  Your notes will be automatically saved as you type
                </p>
                <button
                  onClick={handleNewNote}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Note
                </button>
              </div>
            )}
          </div>

          {/* Tips Card - Hidden on mobile */}
          {isEditing && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 shrink-0 hidden md:block">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Auto-Save Enabled</h3>
                  <p className="mt-0.5 text-xs text-blue-700">
                    Notes are automatically saved after 2 seconds of inactivity.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
