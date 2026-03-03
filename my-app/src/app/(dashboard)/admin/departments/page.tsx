'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService, userService } from '@/services';
import { Card, Button, Input, Modal, Loading } from '@/components/common';
import { Department } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getDepartments(1, 50),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({}, 1, 100),
  });

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    headId: '',
    budget: 0,
  });

  const [budgetData, setBudgetData] = useState({
    budget: 0,
    budgetUsed: 0,
  });

  const createMutation = useMutation({
    mutationFn: departmentService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreateModalOpen(false);
      setNewDepartment({ name: '', description: '', headId: '', budget: 0 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      departmentService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsEditModalOpen(false);
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, budget, budgetUsed }: { id: string; budget: number; budgetUsed: number }) =>
      departmentService.updateBudget(id, budget, budgetUsed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsBudgetModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentService.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newDepartment as any);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDepartment) {
      updateMutation.mutate({ id: selectedDepartment.id, data: selectedDepartment });
    }
  };

  const handleBudgetUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDepartment) {
      updateBudgetMutation.mutate({
        id: selectedDepartment.id,
        budget: budgetData.budget,
        budgetUsed: budgetData.budgetUsed,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBudgetPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading departments..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Manage organizational departments and budgets</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Department
        </Button>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Departments</p>
              <p className="text-3xl font-bold text-gray-900">{departments?.data?.length || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(
                  departments?.data?.reduce((acc, d) => acc + d.budget, 0) || 0
                )}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Budget Utilized</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(
                  departments?.data?.reduce((acc, d) => acc + d.budgetUsed, 0) || 0
                )}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {departments?.data && departments.data.length > 0 ? (
          departments.data.map((department) => {
            const budgetPercentage = getBudgetPercentage(department.budgetUsed, department.budget);
            const head = users?.data?.find((u) => u.id === department.headId);

            return (
              <Card key={department.id}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setSelectedDepartment(department);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this department?')) {
                          deleteMutation.mutate(department.id);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Department Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{department.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{department.description}</p>

                {/* Department Head */}
                {head && (
                  <div className="flex items-center mb-4 p-2 bg-gray-50 rounded-lg">
                    <UserCircleIcon className="h-8 w-8 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {head.firstName} {head.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Department Head</p>
                    </div>
                  </div>
                )}

                {/* Budget */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-medium text-gray-900">{formatCurrency(department.budget)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        budgetPercentage > 90
                          ? 'bg-red-500'
                          : budgetPercentage > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      {formatCurrency(department.budgetUsed)} used
                    </span>
                    <span className={`font-medium ${
                      budgetPercentage > 90 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {budgetPercentage}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    fullWidth
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(department);
                      setBudgetData({ budget: department.budget, budgetUsed: department.budgetUsed });
                      setIsBudgetModalOpen(true);
                    }}
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Manage Budget
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No departments yet</h3>
            <p className="text-gray-500">Create your first department to get started</p>
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Department"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Department Name"
            value={newDepartment.name}
            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newDepartment.description}
              onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Head</label>
            <select
              value={newDepartment.headId}
              onChange={(e) => setNewDepartment({ ...newDepartment, headId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select department head</option>
              {users?.data?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Initial Budget"
            type="number"
            value={newDepartment.budget.toString()}
            onChange={(e) => setNewDepartment({ ...newDepartment, budget: parseFloat(e.target.value) || 0 })}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Department"
        size="lg"
      >
        {selectedDepartment && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Department Name"
              value={selectedDepartment.name}
              onChange={(e) => setSelectedDepartment({ ...selectedDepartment, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={selectedDepartment.description}
                onChange={(e) => setSelectedDepartment({ ...selectedDepartment, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Head</label>
              <select
                value={selectedDepartment.headId || ''}
                onChange={(e) => setSelectedDepartment({ ...selectedDepartment, headId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select department head</option>
                {users?.data?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
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

      {/* Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title={`Manage Budget - ${selectedDepartment?.name}`}
      >
        <form onSubmit={handleBudgetUpdate} className="space-y-4">
          <Input
            label="Total Budget"
            type="number"
            value={budgetData.budget.toString()}
            onChange={(e) => setBudgetData({ ...budgetData, budget: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Budget Used"
            type="number"
            value={budgetData.budgetUsed.toString()}
            onChange={(e) => setBudgetData({ ...budgetData, budgetUsed: parseFloat(e.target.value) || 0 })}
          />
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Remaining Budget</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(budgetData.budget - budgetData.budgetUsed)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  getBudgetPercentage(budgetData.budgetUsed, budgetData.budget) > 90
                    ? 'bg-red-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(getBudgetPercentage(budgetData.budgetUsed, budgetData.budget), 100)}%` }}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateBudgetMutation.isPending}>
              Update Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
