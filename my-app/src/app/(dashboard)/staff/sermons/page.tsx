'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sermonService, mediaService } from '@/services';
import { Card, Button, Input, Modal, Loading } from '@/components/common';
import { Sermon } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

export default function SermonManagement() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: sermons, isLoading } = useQuery({
    queryKey: ['sermons', currentPage],
    queryFn: () => sermonService.getSermons({}, currentPage, 10),
  });

  const [newSermon, setNewSermon] = useState({
    title: '',
    speaker: '',
    date: '',
    series: '',
    scripture: '',
    notes: '',
    audioFile: null as File | null,
    videoFile: null as File | null,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newSermon) => {
      let audioUrl = '';
      let videoUrl = '';

      if (data.audioFile) {
        const uploadedAudio = await mediaService.uploadFile(data.audioFile, 'sermons');
        audioUrl = uploadedAudio.url;
      }
      if (data.videoFile) {
        const uploadedVideo = await mediaService.uploadFile(data.videoFile, 'sermons');
        videoUrl = uploadedVideo.url;
      }

      return sermonService.createSermon({
        title: data.title,
        speaker: data.speaker,
        date: data.date,
        series: data.series,
        scripture: data.scripture,
        notes: data.notes,
        audioUrl,
        videoUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] });
      setIsCreateModalOpen(false);
      setNewSermon({
        title: '',
        speaker: '',
        date: '',
        series: '',
        scripture: '',
        notes: '',
        audioFile: null,
        videoFile: null,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Sermon> }) =>
      sermonService.updateSermon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] });
      setIsEditModalOpen(false);
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      sermonService.publishSermon(id, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sermonService.deleteSermon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newSermon);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSermon) {
      updateMutation.mutate({
        id: selectedSermon.id,
        data: {
          title: selectedSermon.title,
          speaker: selectedSermon.speaker,
          series: selectedSermon.series,
          scripture: selectedSermon.scripture,
          notes: selectedSermon.notes,
        },
      });
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading sermons..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sermon Management</h1>
          <p className="text-gray-600">Create and manage sermon content</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Sermon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Sermons</p>
            <p className="text-3xl font-bold text-gray-900">{sermons?.total || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-3xl font-bold text-green-600">
              {sermons?.data?.filter((s) => s.published).length || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-3xl font-bold text-yellow-600">
              {sermons?.data?.filter((s) => !s.published).length || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="text-3xl font-bold text-blue-600">
              {sermons?.data?.reduce((acc, s) => acc + s.views, 0) || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Sermons Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sermon
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Speaker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stats
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sermons?.data && sermons.data.length > 0 ? (
                sermons.data.map((sermon) => (
                  <tr key={sermon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                          <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sermon.title}</p>
                          <p className="text-sm text-gray-500">{sermon.series || 'No series'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{sermon.speaker}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(sermon.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sermon.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {sermon.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {sermon.views} views • {sermon.downloads} downloads
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() =>
                            publishMutation.mutate({
                              id: sermon.id,
                              published: !sermon.published,
                            })
                          }
                          className={`p-1 ${
                            sermon.published
                              ? 'text-green-600 hover:text-green-800'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={sermon.published ? 'Unpublish' : 'Publish'}
                        >
                          {sermon.published ? (
                            <EyeIcon className="h-5 w-5" />
                          ) : (
                            <EyeSlashIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSermon(sermon);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this sermon?')) {
                              deleteMutation.mutate(sermon.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No sermons found. Create your first sermon to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sermons && sermons.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 mt-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {sermons.totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === sermons.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Sermon Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sermon"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Sermon Title"
            value={newSermon.title}
            onChange={(e) => setNewSermon({ ...newSermon, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Speaker"
              value={newSermon.speaker}
              onChange={(e) => setNewSermon({ ...newSermon, speaker: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={newSermon.date}
              onChange={(e) => setNewSermon({ ...newSermon, date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Series"
              placeholder="e.g., Faith Foundations"
              value={newSermon.series}
              onChange={(e) => setNewSermon({ ...newSermon, series: e.target.value })}
            />
            <Input
              label="Scripture Reference"
              placeholder="e.g., John 3:16"
              value={newSermon.scripture}
              onChange={(e) => setNewSermon({ ...newSermon, scripture: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sermon Notes/Outline
            </label>
            <textarea
              value={newSermon.notes}
              onChange={(e) => setNewSermon({ ...newSermon, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audio File</label>
              <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <CloudArrowUpIcon className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {newSermon.audioFile ? newSermon.audioFile.name : 'Upload audio'}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) =>
                    setNewSermon({ ...newSermon, audioFile: e.target.files?.[0] || null })
                  }
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
              <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <CloudArrowUpIcon className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {newSermon.videoFile ? newSermon.videoFile.name : 'Upload video'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) =>
                    setNewSermon({ ...newSermon, videoFile: e.target.files?.[0] || null })
                  }
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Sermon
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Sermon Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Sermon"
        size="lg"
      >
        {selectedSermon && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Sermon Title"
              value={selectedSermon.title}
              onChange={(e) =>
                setSelectedSermon({ ...selectedSermon, title: e.target.value })
              }
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Speaker"
                value={selectedSermon.speaker}
                onChange={(e) =>
                  setSelectedSermon({ ...selectedSermon, speaker: e.target.value })
                }
                required
              />
              <Input
                label="Series"
                value={selectedSermon.series || ''}
                onChange={(e) =>
                  setSelectedSermon({ ...selectedSermon, series: e.target.value })
                }
              />
            </div>
            <Input
              label="Scripture Reference"
              value={selectedSermon.scripture || ''}
              onChange={(e) =>
                setSelectedSermon({ ...selectedSermon, scripture: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sermon Notes/Outline
              </label>
              <textarea
                value={selectedSermon.notes || ''}
                onChange={(e) =>
                  setSelectedSermon({ ...selectedSermon, notes: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
