import apiClient from '@/lib/api-client';

// Types
export interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ministries?: Array<{ _id: string; name: string }>;
}

export interface AttendanceRecord {
  _id: string;
  userId: Member | string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
  markedBy?: { firstName: string; lastName: string };
  isFirstTimeVisitor?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  ministryId?: string;
}

export interface CheckInResponse {
  attendance: AttendanceRecord;
  user: Member;
  isNewMember: boolean;
}

export interface UserLookupResponse {
  exists: boolean;
  user: Member | null;
  alreadyCheckedInToday: boolean;
}

export interface AttendanceFilters {
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  attendance: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AttendanceAnalytics {
  period: { startDate: string; endDate: string };
  summary: {
    totalAttendance: number;
    avgAttendancePerDay: number;
    firstTimeVisitors: number;
    totalDays: number;
  };
  byStatus: Record<string, number>;
  trendByDate: Array<{ _id: string; count: number }>;
  topAttendees: Array<{
    _id: string;
    attendanceCount: number;
    user: { firstName: string; lastName: string; email: string };
  }>;
}

// Helper to extract data from API response
const extractData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const attendanceService = {
  // Get all members for quick lookup
  getAllMembers: async (): Promise<Member[]> => {
    const response = await apiClient.get('/attendance/members');
    const data = extractData<{ members: Member[] }>(response);
    return data.members || [];
  },

  // Lookup user by name
  lookupUser: async (firstName: string, lastName: string): Promise<UserLookupResponse> => {
    const response = await apiClient.get('/attendance/lookup', {
      params: { firstName, lastName },
    });
    return extractData(response);
  },

  // Quick check-in (handles both existing and new members)
  checkIn: async (data: CheckInData): Promise<CheckInResponse> => {
    const response = await apiClient.post('/attendance/checkin', data);
    return extractData(response);
  },

  // Get today's attendance
  getTodayAttendance: async (): Promise<AttendanceRecord[]> => {
    const response = await apiClient.get('/attendance/today');
    const data = extractData<{ attendance: AttendanceRecord[] }>(response);
    return data.attendance || [];
  },

  // Get attendance records with filters and pagination
  getAttendance: async (
    filters?: AttendanceFilters,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<AttendanceRecord>> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/attendance', { params });
    return extractData(response);
  },

  // Get user attendance history
  getUserAttendance: async (userId: string): Promise<AttendanceRecord[]> => {
    const response = await apiClient.get(`/attendance/user/${userId}`);
    const data = extractData<{ attendance: AttendanceRecord[] }>(response);
    return data.attendance || [];
  },

  // Mark attendance for known user
  markAttendance: async (data: {
    userId: string;
    date?: string;
    status?: string;
    notes?: string;
  }): Promise<AttendanceRecord> => {
    const response = await apiClient.post('/attendance', data);
    const result = extractData<{ attendance: AttendanceRecord }>(response);
    return result.attendance;
  },

  // Update attendance
  updateAttendance: async (
    id: string,
    data: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> => {
    const response = await apiClient.put(`/attendance/${id}`, data);
    const result = extractData<{ attendance: AttendanceRecord }>(response);
    return result.attendance;
  },

  // Delete attendance
  deleteAttendance: async (id: string): Promise<void> => {
    await apiClient.delete(`/attendance/${id}`);
  },

  // Checkout
  checkOut: async (id: string, checkOutTime?: string): Promise<AttendanceRecord> => {
    const response = await apiClient.post(`/attendance/${id}/checkout`, { checkOutTime });
    const result = extractData<{ attendance: AttendanceRecord }>(response);
    return result.attendance;
  },

  // Get attendance analytics
  getAttendanceAnalytics: async (
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceAnalytics> => {
    const params = { startDate, endDate };
    const response = await apiClient.get('/attendance/analytics', { params });
    const data = extractData<{ analytics: AttendanceAnalytics }>(response);
    return data.analytics;
  },

  // Get user attendance stats
  getUserAttendanceStats: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/attendance/user/${userId}/stats`);
    const data = extractData<{ stats: any }>(response);
    return data.stats;
  },
};
