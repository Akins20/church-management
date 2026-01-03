'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '@/services';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 8;

export default function NotepadHistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState({ title: '', content: '' });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch notes with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['notesHistory', page, searchTerm],
    queryFn: () => noteService.getNotes({ search: searchTerm || undefined }, page, ITEMS_PER_PAGE),
  });

  const notes = data?.notes || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, title, content }: { id: string; title: string; content: string }) =>
      noteService.updateNote(id, { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notesHistory'] });
      setIsEditing(false);
      setSelectedNote(null);
      setNotification({ type: 'success', message: 'Note updated successfully' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to update note' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => noteService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notesHistory'] });
      setSelectedNote(null);
      setNotification({ type: 'success', message: 'Note deleted successfully' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to delete note' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleView = (note: any) => {
    setSelectedNote(note);
    setIsEditing(false);
  };

  const handleEdit = (note: any) => {
    setSelectedNote(note);
    setEditContent({ title: note.title, content: note.content || '' });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedNote) {
      updateNoteMutation.mutate({
        id: selectedNote._id,
        title: editContent.title,
        content: editContent.content,
      });
    }
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const closeModal = () => {
    setSelectedNote(null);
    setIsEditing(false);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
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
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes History</h1>
            <p className="text-gray-500 text-sm mt-0.5">View and manage your past notes</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="px-3 py-2 bg-gray-100 rounded-xl text-sm">
              <span className="font-semibold text-gray-900">{total}</span>
              <span className="text-gray-500 ml-1">notes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 p-6">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No notes found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Create some notes to see them here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate flex-1 pr-2">
                    {note.title || 'Untitled'}
                  </h3>
                  <DocumentTextIcon className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
                <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                  {note.content || 'No content'}
                </p>
                <div className="flex items-center text-[10px] text-gray-400 mb-3">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {formatDate(note.updatedAt)}
                </div>
                <div className="flex items-center justify-end space-x-1 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleView(note)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(note)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View/Edit Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Note' : 'View Note'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-5 min-h-0 overflow-hidden">
              {isEditing ? (
                <div className="h-full flex flex-col space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editContent.title}
                      onChange={(e) => setEditContent((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={editContent.content}
                      onChange={(e) => setEditContent((prev) => ({ ...prev, content: e.target.value }))}
                      className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedNote.title || 'Untitled'}
                  </h3>
                  <div className="flex-1 min-h-0">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedNote.content || 'No content'}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500 shrink-0">
                    <p>Created: {formatDateTime(selectedNote.createdAt)}</p>
                    <p>Updated: {formatDateTime(selectedNote.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-5 border-t border-gray-200 shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              {isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  disabled={updateNoteMutation.isPending}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {updateNoteMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditContent({ title: selectedNote.title, content: selectedNote.content || '' });
                    setIsEditing(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                >
                  <PencilSquareIcon className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
