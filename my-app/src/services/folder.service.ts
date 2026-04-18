import apiClient from '@/lib/api-client';

export interface Folder {
  _id: string;
  userId: string;
  name: string;
  parentId: string | null;
  color?: string | null;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode extends Folder {
  children: FolderNode[];
  noteCount: number;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
}

export type FolderDeleteCascade = 'move-to-root' | 'delete-contents';

const extractData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const folderService = {
  listFlat: async (parentId?: string | 'root'): Promise<Folder[]> => {
    const params: Record<string, unknown> = {};
    if (parentId) params.parentId = parentId;
    const response = await apiClient.get('/folders', { params });
    return extractData<{ folders: Folder[] }>(response).folders;
  },

  listTree: async (): Promise<FolderNode[]> => {
    const response = await apiClient.get('/folders', { params: { tree: true } });
    return extractData<{ folders: FolderNode[] }>(response).folders;
  },

  getById: async (id: string): Promise<Folder> => {
    const response = await apiClient.get(`/folders/${id}`);
    return extractData<{ folder: Folder }>(response).folder;
  },

  create: async (data: CreateFolderInput): Promise<Folder> => {
    const response = await apiClient.post('/folders', data);
    return extractData<{ folder: Folder }>(response).folder;
  },

  update: async (id: string, data: UpdateFolderInput): Promise<Folder> => {
    const response = await apiClient.put(`/folders/${id}`, data);
    return extractData<{ folder: Folder }>(response).folder;
  },

  delete: async (id: string, cascade: FolderDeleteCascade = 'move-to-root'): Promise<void> => {
    await apiClient.delete(`/folders/${id}`, { params: { cascade } });
  },
};
