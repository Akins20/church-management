import apiClient from '@/lib/api-client';

// Types
export interface Note {
  _id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedNotesResponse {
  notes: Note[];
  total: number;
  page: number;
  totalPages: number;
}

// Helper to extract data from API response
const extractData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const noteService = {
  // Get all notes with filters and pagination
  getNotes: async (
    filters?: NoteFilters,
    page = 1,
    limit = 20
  ): Promise<PaginatedNotesResponse> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/notes', { params });
    return extractData(response);
  },

  // Get note by ID
  getNoteById: async (id: string): Promise<Note> => {
    const response = await apiClient.get(`/notes/${id}`);
    const data = extractData<{ note: Note }>(response);
    return data.note;
  },

  // Create new note
  createNote: async (data: { title: string; content?: string }): Promise<Note> => {
    const response = await apiClient.post('/notes', data);
    const result = extractData<{ note: Note }>(response);
    return result.note;
  },

  // Update note
  updateNote: async (
    id: string,
    data: { title?: string; content?: string }
  ): Promise<Note> => {
    const response = await apiClient.put(`/notes/${id}`, data);
    const result = extractData<{ note: Note }>(response);
    return result.note;
  },

  // Delete note
  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },
};
