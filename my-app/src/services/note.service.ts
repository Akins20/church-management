import apiClient from '@/lib/api-client';

// Types
export interface Note {
  _id: string;
  userId: string;
  title: string;
  content: string;
  folderId: string | null;
  isPinned: boolean;
  pinnedAt?: string | null;
  isArchived: boolean;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  color?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type NoteSort = 'pinned' | 'updatedAt' | 'createdAt' | 'title';

export interface NoteFilters {
  search?: string;
  folderId?: string | 'root' | 'null' | 'any';
  tags?: string[] | string;
  color?: string;
  pinned?: boolean;
  favorite?: boolean;
  archived?: boolean;
  deleted?: boolean;
  startDate?: string;
  endDate?: string;
  sort?: NoteSort;
  order?: 'asc' | 'desc';
}

export interface PaginatedNotesResponse {
  notes: Note[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  folderId?: string | null;
  isPinned?: boolean;
  isFavorite?: boolean;
  color?: string | null;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  folderId?: string | null;
  isPinned?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  color?: string | null;
  tags?: string[];
}

const extractData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

const serializeFilters = (filters: NoteFilters = {}) => {
  const params: Record<string, unknown> = { ...filters };
  if (Array.isArray(filters.tags)) {
    params.tags = filters.tags.join(',');
  }
  Object.keys(params).forEach((k) => {
    if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k];
  });
  return params;
};

export const noteService = {
  getNotes: async (
    filters: NoteFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedNotesResponse> => {
    const params = { ...serializeFilters(filters), page, limit };
    const response = await apiClient.get('/notes', { params });
    return extractData(response);
  },

  getNoteById: async (id: string): Promise<Note> => {
    const response = await apiClient.get(`/notes/${id}`);
    return extractData<{ note: Note }>(response).note;
  },

  createNote: async (data: CreateNoteInput): Promise<Note> => {
    const response = await apiClient.post('/notes', data);
    return extractData<{ note: Note }>(response).note;
  },

  updateNote: async (id: string, data: UpdateNoteInput): Promise<Note> => {
    const response = await apiClient.put(`/notes/${id}`, data);
    return extractData<{ note: Note }>(response).note;
  },

  moveNote: async (id: string, folderId: string | null): Promise<Note> => {
    const response = await apiClient.patch(`/notes/${id}/move`, { folderId });
    return extractData<{ note: Note }>(response).note;
  },

  togglePin: async (id: string): Promise<Note> => {
    const response = await apiClient.patch(`/notes/${id}/pin`);
    return extractData<{ note: Note }>(response).note;
  },

  toggleArchive: async (id: string): Promise<Note> => {
    const response = await apiClient.patch(`/notes/${id}/archive`);
    return extractData<{ note: Note }>(response).note;
  },

  toggleFavorite: async (id: string): Promise<Note> => {
    const response = await apiClient.patch(`/notes/${id}/favorite`);
    return extractData<{ note: Note }>(response).note;
  },

  /** Soft delete — moves to "Recently Deleted" */
  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },

  restoreNote: async (id: string): Promise<Note> => {
    const response = await apiClient.post(`/notes/${id}/restore`);
    return extractData<{ note: Note }>(response).note;
  },

  permanentDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}/permanent`);
  },

  bulkMove: async (ids: string[], folderId: string | null) => {
    const response = await apiClient.post('/notes/bulk/move', { ids, folderId });
    return extractData<{ matched: number; modified: number }>(response);
  },

  bulkSoftDelete: async (ids: string[]) => {
    const response = await apiClient.post('/notes/bulk/delete', { ids });
    return extractData<{ matched: number; modified: number }>(response);
  },

  bulkRestore: async (ids: string[]) => {
    const response = await apiClient.post('/notes/bulk/restore', { ids });
    return extractData<{ matched: number; modified: number }>(response);
  },

  bulkPermanentDelete: async (ids: string[]) => {
    const response = await apiClient.post('/notes/bulk/permanent-delete', { ids });
    return extractData<{ deleted: number }>(response);
  },

  listTags: async (): Promise<string[]> => {
    const response = await apiClient.get('/notes/tags');
    return extractData<{ tags: string[] }>(response).tags;
  },
};
