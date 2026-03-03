'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailService } from '@/services';
import { Card, Button, Input, Modal, Loading } from '@/components/common';
import { EmailTemplate } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

export default function EmailTemplates() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: emailService.getTemplates,
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    category: '',
    variables: [] as string[],
  });

  const [variableInput, setVariableInput] = useState('');

  const createMutation = useMutation({
    mutationFn: emailService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setIsCreateModalOpen(false);
      setNewTemplate({ name: '', subject: '', body: '', category: '', variables: [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailTemplate> }) =>
      emailService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: emailService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newTemplate as any);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate) {
      updateMutation.mutate({
        id: selectedTemplate.id,
        data: {
          name: selectedTemplate.name,
          subject: selectedTemplate.subject,
          body: selectedTemplate.body,
          category: selectedTemplate.category,
          variables: selectedTemplate.variables,
        },
      });
    }
  };

  const addVariable = () => {
    if (variableInput && !newTemplate.variables.includes(variableInput)) {
      setNewTemplate({
        ...newTemplate,
        variables: [...newTemplate.variables, variableInput],
      });
      setVariableInput('');
    }
  };

  const removeVariable = (variable: string) => {
    setNewTemplate({
      ...newTemplate,
      variables: newTemplate.variables.filter((v) => v !== variable),
    });
  };

  const categories = ['Welcome', 'Events', 'Announcements', 'Follow-up', 'Birthday', 'General'];

  if (isLoading) {
    return <Loading fullScreen text="Loading templates..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600">Create and manage reusable email templates</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates && templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsPreviewModalOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this template?')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{template.subject}</p>

              {template.category && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs mb-3">
                  <TagIcon className="h-3 w-3 mr-1" />
                  {template.category}
                </span>
              )}

              <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>

              {template.variables && template.variables.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <DocumentDuplicateIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No templates yet</h3>
            <p className="text-gray-500">Create your first template to get started</p>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Email Template"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g., Welcome Email"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newTemplate.category}
              onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
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
          <Input
            label="Subject Line"
            placeholder="Email subject"
            value={newTemplate.subject}
            onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Body
            </label>
            <textarea
              value={newTemplate.body}
              onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="Write your email template here. Use {{variableName}} for dynamic content."
              required
            />
          </div>

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variables</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add variable (e.g., firstName)"
                value={variableInput}
                onChange={(e) => setVariableInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="button" variant="outline" onClick={addVariable}>
                Add
              </Button>
            </div>
            {newTemplate.variables.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newTemplate.variables.map((variable) => (
                  <span
                    key={variable}
                    className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
                  >
                    {`{{${variable}}}`}
                    <button
                      type="button"
                      onClick={() => removeVariable(variable)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Template"
        size="lg"
      >
        {selectedTemplate && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Template Name"
              value={selectedTemplate.name}
              onChange={(e) =>
                setSelectedTemplate({ ...selectedTemplate, name: e.target.value })
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedTemplate.category || ''}
                onChange={(e) =>
                  setSelectedTemplate({ ...selectedTemplate, category: e.target.value })
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
            <Input
              label="Subject Line"
              value={selectedTemplate.subject}
              onChange={(e) =>
                setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Body
              </label>
              <textarea
                value={selectedTemplate.body}
                onChange={(e) =>
                  setSelectedTemplate({ ...selectedTemplate, body: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
                required
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

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Template Preview"
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Subject:</p>
              <p className="font-medium text-gray-900">{selectedTemplate.subject}</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Body:</p>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 text-sm">
                  {selectedTemplate.body}
                </pre>
              </div>
            </div>
            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
