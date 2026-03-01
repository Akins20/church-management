'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, userService, sermonService, ministryService } from '@/services';
import { Card, Button, Loading } from '@/components/common';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  lastGenerated?: string;
}

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [generatedReports, setGeneratedReports] = useState<string[]>([]);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'attendance-summary',
      name: 'Attendance Summary Report',
      description: 'Weekly and monthly attendance statistics across all services',
      category: 'attendance',
      icon: ChartBarIcon,
      lastGenerated: '2024-01-15',
    },
    {
      id: 'attendance-trends',
      name: 'Attendance Trends Analysis',
      description: 'Historical attendance patterns and growth trends',
      category: 'attendance',
      icon: ChartBarIcon,
    },
    {
      id: 'member-directory',
      name: 'Member Directory Export',
      description: 'Complete member list with contact information',
      category: 'members',
      icon: UsersIcon,
      lastGenerated: '2024-01-10',
    },
    {
      id: 'new-members',
      name: 'New Members Report',
      description: 'List of members who joined within the selected period',
      category: 'members',
      icon: UsersIcon,
    },
    {
      id: 'member-engagement',
      name: 'Member Engagement Report',
      description: 'Analysis of member participation and activity levels',
      category: 'members',
      icon: UsersIcon,
    },
    {
      id: 'ministry-roster',
      name: 'Ministry Roster Report',
      description: 'Ministry assignments and volunteer schedules',
      category: 'ministries',
      icon: CalendarIcon,
      lastGenerated: '2024-01-12',
    },
    {
      id: 'ministry-participation',
      name: 'Ministry Participation Report',
      description: 'Member involvement across different ministries',
      category: 'ministries',
      icon: CalendarIcon,
    },
    {
      id: 'sermon-archive',
      name: 'Sermon Archive Report',
      description: 'List of all sermons with statistics',
      category: 'content',
      icon: DocumentTextIcon,
    },
    {
      id: 'sermon-engagement',
      name: 'Sermon Engagement Report',
      description: 'Views, downloads, and engagement metrics for sermons',
      category: 'content',
      icon: DocumentTextIcon,
    },
    {
      id: 'service-schedule',
      name: 'Service Schedule Report',
      description: 'Upcoming service schedules and volunteer assignments',
      category: 'services',
      icon: CalendarIcon,
    },
    {
      id: 'annual-summary',
      name: 'Annual Summary Report',
      description: 'Comprehensive year-end summary of all church activities',
      category: 'summary',
      icon: ChartBarIcon,
    },
    {
      id: 'quarterly-review',
      name: 'Quarterly Review Report',
      description: 'Quarter-over-quarter comparison of key metrics',
      category: 'summary',
      icon: ChartBarIcon,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Reports' },
    { id: 'attendance', name: 'Attendance' },
    { id: 'members', name: 'Members' },
    { id: 'ministries', name: 'Ministries' },
    { id: 'content', name: 'Content' },
    { id: 'services', name: 'Services' },
    { id: 'summary', name: 'Summary' },
  ];

  const filteredReports =
    selectedCategory === 'all'
      ? reportTemplates
      : reportTemplates.filter((r) => r.category === selectedCategory);

  const handleGenerateReport = async (reportId: string) => {
    setGeneratingReport(reportId);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setGeneratedReports((prev) => [...prev, reportId]);
    setGeneratingReport(null);
  };

  const handleDownload = (reportId: string, format: 'pdf' | 'csv' | 'xlsx') => {
    // In a real implementation, this would trigger the actual download
    console.log(`Downloading ${reportId} as ${format}`);
    alert(`Downloading ${reportId} report as ${format.toUpperCase()}`);
  };

  const recentReports = [
    {
      id: '1',
      name: 'Attendance Summary Report',
      generatedAt: '2024-01-15T10:30:00',
      format: 'PDF',
      size: '245 KB',
    },
    {
      id: '2',
      name: 'Member Directory Export',
      generatedAt: '2024-01-10T14:15:00',
      format: 'XLSX',
      size: '1.2 MB',
    },
    {
      id: '3',
      name: 'Ministry Roster Report',
      generatedAt: '2024-01-12T09:00:00',
      format: 'PDF',
      size: '180 KB',
    },
    {
      id: '4',
      name: 'Weekly Attendance',
      generatedAt: '2024-01-08T16:45:00',
      format: 'CSV',
      size: '45 KB',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and download various church reports</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                This Week
              </Button>
              <Button variant="outline" size="sm">
                This Month
              </Button>
              <Button variant="outline" size="sm">
                This Year
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const Icon = report.icon;
          const isGenerating = generatingReport === report.id;
          const isGenerated = generatedReports.includes(report.id);

          return (
            <Card key={report.id} hoverable>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                  {report.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{report.description}</p>

              {report.lastGenerated && (
                <p className="text-xs text-gray-400 mb-4">
                  Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                </p>
              )}

              <div className="flex items-center space-x-2">
                {isGenerated ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report.id, 'pdf')}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report.id, 'csv')}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report.id, 'xlsx')}
                    >
                      Excel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    isLoading={isGenerating}
                    onClick={() => handleGenerateReport(report.id)}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                )}
              </div>

              {isGenerated && (
                <div className="mt-3 flex items-center text-green-600 text-sm">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Report ready for download
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <Card title="Recently Generated Reports">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Report Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Generated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="font-medium text-gray-900">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {new Date(report.generatedAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {report.format}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{report.size}</td>
                  <td className="px-4 py-4 text-right">
                    <Button variant="outline" size="sm">
                      <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scheduled Reports */}
      <Card title="Scheduled Reports">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Weekly Attendance Summary</p>
                <p className="text-sm text-gray-500">Every Monday at 8:00 AM</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Active
              </span>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Monthly Member Report</p>
                <p className="text-sm text-gray-500">1st of every month at 6:00 AM</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Active
              </span>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </div>

          <Button variant="outline" fullWidth>
            + Schedule New Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
