'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sermonService } from '@/services';
import { Card, Loading, Button } from '@/components/common';
import {
  MagnifyingGlassIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  CalendarIcon,
  BookOpenIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

export default function SermonLibrary() {
  const [search, setSearch] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: sermons, isLoading } = useQuery({
    queryKey: ['sermons', search, selectedSeries, selectedSpeaker, currentPage],
    queryFn: () =>
      sermonService.getSermons(
        {
          series: selectedSeries || undefined,
          speaker: selectedSpeaker || undefined,
        },
        currentPage,
        12
      ),
  });

  // Ensure sermons.data is an array
  const sermonsList = Array.isArray(sermons?.data) ? sermons.data : [];

  // Get unique series and speakers for filters
  const series = [...new Set(sermonsList.map((s) => s.series).filter(Boolean))] as string[];
  const speakers = [...new Set(sermonsList.map((s) => s.speaker).filter(Boolean))] as string[];

  const filteredSermons = sermonsList.filter(
    (sermon) =>
      sermon.title.toLowerCase().includes(search.toLowerCase()) ||
      sermon.speaker.toLowerCase().includes(search.toLowerCase()) ||
      sermon.scripture?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <Loading fullScreen text="Loading sermons..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Sermon Library</h1>
        <p className="text-gray-600 mt-2">
          Browse and listen to our collection of inspiring messages
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sermons by title, speaker, or scripture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Series</option>
            {series.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Speakers</option>
            {speakers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sermon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSermons && filteredSermons.length > 0 ? (
          filteredSermons.map((sermon) => (
            <Card key={sermon.id} className="flex flex-col">
              {/* Thumbnail Placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-2 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-full transition-colors">
                    <PlayIcon className="h-10 w-10 text-white" />
                  </button>
                </div>
                {sermon.series && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    {sermon.series}
                  </span>
                )}
              </div>

              {/* Sermon Info */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {sermon.title}
              </h3>

              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span className="font-medium text-gray-700">{sermon.speaker}</span>
              </div>

              {sermon.scripture && (
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  <span>{sermon.scripture}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-500 mb-2">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>{new Date(sermon.date).toLocaleDateString()}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center text-xs text-gray-400 mb-2">
                <span>{sermon.views} views</span>
                <span className="mx-2">•</span>
                <span>{sermon.downloads} downloads</span>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex space-x-2">
                <Button variant="primary" size="sm" fullWidth>
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Watch
                </Button>
                <Button variant="outline" size="sm">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ShareIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">No sermons found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {sermons && sermons.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {sermons.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === sermons.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
