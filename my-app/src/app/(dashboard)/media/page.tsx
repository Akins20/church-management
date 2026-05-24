'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaService } from '@/services';
import { Card, Button, Input, Loading } from '@/components/common';
import { MediaFile } from '@/types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  MusicalNoteIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderIcon,
  Squares2X2Icon,
  ListBulletIcon,
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

export default function MediaGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  const { data: mediaFiles, isLoading } = useQuery({
    queryKey: ['media', searchQuery, selectedType, selectedCategory, currentPage],
    queryFn: () =>
      mediaService.getFiles(
        {
          search: searchQuery || undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        },
        currentPage,
        24
      ),
  });

  const { data: stats } = useQuery({
    queryKey: ['mediaStats'],
    queryFn: mediaService.getStats,
  });

  const fileTypes = ['all', 'image', 'video', 'audio', 'document'];
  const categories = ['all', 'Sermons', 'Events', 'Worship', 'Gallery', 'Documents'];

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

  const handleDownload = async (file: MediaFile) => {
    try {
      const blob = await mediaService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
          <p className="text-gray-600">Browse and download church files — images, audio, video and documents. Use the toggle to switch between grid and list view.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <PhotoIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Images</p>
              <p className="text-xl font-bold text-gray-900">{stats?.images || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <VideoCameraIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Videos</p>
              <p className="text-xl font-bold text-gray-900">{stats?.videos || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <MusicalNoteIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Audio</p>
              <p className="text-xl font-bold text-gray-900">{stats?.audio || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <DocumentIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Documents</p>
              <p className="text-xl font-bold text-gray-900">{stats?.documents || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fileTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Media Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaFiles?.data && mediaFiles.data.length > 0 ? (
            mediaFiles.data.map((file) => {
              const Icon = getFileIcon(file.type);
              const colorClass = getFileColor(file.type);

              return (
                <div
                  key={file.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {file.type === 'image' && file.thumbnailUrl ? (
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={file.thumbnailUrl}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-2 bg-white rounded-full mr-2"
                        >
                          <EyeIcon className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-2 bg-white rounded-full"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                      <div className={`p-4 rounded-lg ${colorClass}`}>
                        <Icon className="h-12 w-12" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-2 bg-white rounded-full mr-2"
                        >
                          <EyeIcon className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-2 bg-white rounded-full"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No media files found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
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
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-gray-900">{file.filename}</span>
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
                              onClick={() => setPreviewFile(file)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1 text-gray-400 hover:text-green-600"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No media files found. Try adjusting your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {mediaFiles && mediaFiles.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * 24 + 1} to{' '}
            {Math.min(currentPage * 24, mediaFiles.total)} of {mediaFiles.total} files
          </p>
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

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{previewFile.filename}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              {previewFile.type === 'image' ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.filename}
                  className="max-h-96 mx-auto"
                />
              ) : previewFile.type === 'video' ? (
                <video src={previewFile.url} controls className="max-h-96 mx-auto w-full" />
              ) : previewFile.type === 'audio' ? (
                <audio src={previewFile.url} controls className="w-full" />
              ) : (
                <div className="text-center py-12">
                  <DocumentIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Size: {formatFileSize(previewFile.size)} • Type: {previewFile.mimeType}
                  </p>
                  <p className="text-sm text-gray-500">
                    Uploaded: {new Date(previewFile.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="primary" onClick={() => handleDownload(previewFile)}>
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
