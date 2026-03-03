'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/services';
import { Card, Button, Input, Modal, Loading } from '@/components/common';
import { MediaFile } from '@/types';
import {
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  MusicalNoteIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const FILE_TYPE_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  image: PhotoIcon,
  video: VideoCameraIcon,
  audio: MusicalNoteIcon,
  document: DocumentIcon,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  image: 'bg-blue-100 text-blue-600',
  video: 'bg-purple-100 text-purple-600',
  audio: 'bg-green-100 text-green-600',
  document: 'bg-orange-100 text-orange-600',
};

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function MediaManagement() {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploadCategory, setUploadCategory] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const { data: mediaFiles, isLoading } = useQuery({
    queryKey: ['staffMedia', currentPage],
    queryFn: () => mediaService.getFiles({}, currentPage, 20),
  });

  const { data: stats } = useQuery({
    queryKey: ['mediaStats'],
    queryFn: mediaService.getStats,
  });

  const deleteMutation = useMutation({
    mutationFn: mediaService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMedia'] });
      queryClient.invalidateQueries({ queryKey: ['mediaStats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MediaFile> }) =>
      mediaService.updateFile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMedia'] });
      setIsEditModalOpen(false);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: mediaService.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMedia'] });
      queryClient.invalidateQueries({ queryKey: ['mediaStats'] });
      setSelectedFiles([]);
    },
  });

  const categories = ['Sermons', 'Events', 'Worship', 'Gallery', 'Documents', 'Other'];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newItems: UploadItem[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploadQueue((prev) => [...prev, ...newItems]);
    setIsUploadModalOpen(true);
  };

  const uploadFiles = async () => {
    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status !== 'pending') continue;

      setUploadQueue((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, status: 'uploading' } : u))
      );

      try {
        await mediaService.uploadFile(item.file, uploadCategory);
        setUploadQueue((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'success', progress: 100 } : u))
        );
      } catch (error: any) {
        setUploadQueue((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? { ...u, status: 'error', error: error.message || 'Upload failed' }
              : u
          )
        );
      }
    }

    queryClient.invalidateQueries({ queryKey: ['staffMedia'] });
    queryClient.invalidateQueries({ queryKey: ['mediaStats'] });
  };

  const clearUploadQueue = () => {
    setUploadQueue([]);
    setIsUploadModalOpen(false);
    setUploadCategory('');
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const getFileIcon = (type: string) => {
    return FILE_TYPE_ICONS[type] || DocumentIcon;
  };

  const getFileColor = (type: string) => {
    return FILE_TYPE_COLORS[type] || 'bg-gray-100 text-gray-600';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (mediaFiles?.data) {
      if (selectedFiles.length === mediaFiles.data.length) {
        setSelectedFiles([]);
      } else {
        setSelectedFiles(mediaFiles.data.map((f) => f.id));
      }
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      updateMutation.mutate({
        id: selectedFile.id,
        data: {
          filename: selectedFile.filename,
          category: selectedFile.category,
          description: selectedFile.description,
        },
      });
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading media..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Management</h1>
          <p className="text-gray-600">Upload and manage church media files</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedFiles.length > 0 && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Delete ${selectedFiles.length} selected files?`)) {
                  bulkDeleteMutation.mutate(selectedFiles);
                }
              }}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Selected ({selectedFiles.length})
            </Button>
          )}
          <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Files</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Images</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.images || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Videos</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.videos || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Audio</p>
            <p className="text-2xl font-bold text-green-600">{stats?.audio || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Storage Used</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatFileSize(stats?.storageUsed || 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-1">
          Drag and drop files here
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse from your computer
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Browse Files
          </span>
        </label>
      </div>

      {/* Files Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      mediaFiles?.data &&
                      mediaFiles.data.length > 0 &&
                      selectedFiles.length === mediaFiles.data.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  File
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Uploaded
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mediaFiles?.data && mediaFiles.data.length > 0 ? (
                mediaFiles.data.map((file) => {
                  const Icon = getFileIcon(file.type);
                  const colorClass = getFileColor(file.type);

                  return (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {file.type === 'image' && file.thumbnailUrl ? (
                            <img
                              src={file.thumbnailUrl}
                              alt={file.filename}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          ) : (
                            <div className={`p-2 rounded-lg mr-3 ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{file.filename}</p>
                            {file.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {file.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 capitalize">{file.type}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {file.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedFile(file);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this file?')) {
                                deleteMutation.mutate(file.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    No files uploaded yet. Start by uploading some media.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {mediaFiles && mediaFiles.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 mt-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {mediaFiles.totalPages}
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
                disabled={currentPage === mediaFiles.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={clearUploadQueue}
        title="Upload Files"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Queue */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {uploadQueue.length > 0 ? (
              uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <DocumentIcon className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                    {item.status === 'uploading' && (
                      <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                    {item.status === 'error' && (
                      <div className="text-right">
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                        <p className="text-xs text-red-600">{item.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <input
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  id="modal-file-upload"
                />
                <label
                  htmlFor="modal-file-upload"
                  className="cursor-pointer"
                >
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to select files</p>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={clearUploadQueue}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={uploadFiles}
              disabled={uploadQueue.length === 0 || uploadQueue.every((i) => i.status !== 'pending')}
            >
              Upload {uploadQueue.filter((i) => i.status === 'pending').length} Files
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit File"
      >
        {selectedFile && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Filename"
              value={selectedFile.filename}
              onChange={(e) =>
                setSelectedFile({ ...selectedFile, filename: e.target.value })
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedFile.category || ''}
                onChange={(e) =>
                  setSelectedFile({ ...selectedFile, category: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={selectedFile.description || ''}
                onChange={(e) =>
                  setSelectedFile({ ...selectedFile, description: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
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
