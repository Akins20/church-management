// User Roles (lowercase to match backend API)
export enum UserRole {
  NEWCOMER = 'newcomer',
  MEMBER = 'member',
  STAFF = 'staff',
  ADMIN = 'admin'
}

// Membership Status (lowercase to match backend API)
export enum MembershipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// User Interface (matches backend API schema)
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: UserRole | string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  metadata?: {
    membershipStatus?: MembershipStatus | string;
    joinDate?: string;
  };
  membershipStatus?: MembershipStatus | string;
  dateJoined?: string;
  departmentId?: string;
  ministries?: Array<string | { id: string; name: string }>;
  group?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth Interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
}

// Backend API response structure
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

// Simple auth response for internal use
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Attendance Interfaces
export interface Attendance {
  id: string;
  userId: string;
  sundayServiceId: string;
  serviceId?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  notes?: string;
  markedBy: string;
  createdAt: string;
  checkInTime?: string;
  checkOutTime?: string;
  user?: User;
  service?: SundayService;
}

export interface AttendanceStats {
  totalAttendance: number;
  averageAttendance: number;
  attendanceRate: number;
  firstTimeVisitors: number;
  returningMembers: number;
  todayCount?: number;
  totalMembers?: number;
  weekCount?: number;
}

// Ministry Interfaces
export interface Ministry {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  members: string[];
  category?: string;
  meetingSchedule?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// Department Interfaces
export interface Department {
  id: string;
  name: string;
  description: string;
  headId?: string;
  budget: number;
  budgetUsed: number;
  createdAt: string;
  updatedAt: string;
}

// Sermon Interfaces
export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  series?: string;
  scripture?: string;
  audioUrl?: string;
  videoUrl?: string;
  notes?: string;
  transcript?: string;
  published: boolean;
  views: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

// Sunday Service Interfaces
export interface SundayService {
  id: string;
  date: string;
  theme?: string;
  sermonId?: string;
  leaderId?: string;
  team?: string[];
  announcements?: string;
  completed: boolean;
  attendanceCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Email Interfaces
export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  error?: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// Media Interfaces
export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category?: string;
  description?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  uploadedBy: string;
  views: number;
  downloads: number;
  createdAt: string;
}

// Alias for backward compatibility
export type MediaFile = Media;

export interface MediaStats {
  total: number;
  images: number;
  videos: number;
  audio: number;
  documents: number;
  storageUsed: number;
  usedStorage?: number;
  totalStorage?: number;
}

// Analytics Interfaces
export interface AnalyticsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// API Response Interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter Interfaces
export interface UserFilters {
  role?: UserRole;
  membershipStatus?: MembershipStatus;
  departmentId?: string;
  ministryId?: string;
  search?: string;
}

export interface AttendanceFilters {
  userId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface SermonFilters {
  speaker?: string;
  series?: string;
  startDate?: string;
  endDate?: string;
  published?: boolean;
}
