import { UserSummary, ReportSummary, ClaimSummary } from '../models';

export interface ApiError {
  Message: string;
  Errors?: any;
}

export interface AuthResponse {
  Token: string;
  User: UserSummary;
}

export interface PaginatedResponse<T> {
  Data: T[];
  Total: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
}

export interface StudentDashboardResponse {
  MyReports: ReportSummary[];
  MyClaims: ClaimSummary[];
  Summary: {
    MyReportsCount: number;
    ActiveClaimsCount: number;
    ReturnedItemsCount: number;
  };
}

export interface AdminDashboardResponse {
  PendingReports: ReportSummary[];
  PendingClaims: ClaimSummary[];
  Summary: {
    PendingReportsCount: number;
    OpenReportsCount: number;
    PendingClaimsCount: number;
    ReturnedItemsCount: number;
  };
}

export interface LoginRequest {
  Email: string;
  PasswordHash: string; // The requirement says email and password, we will send plain password and hash in backend, so let's call it Password.
}

export interface RegisterRequest {
  Name: string;
  StudentNumber: string;
  Email: string;
  Password: string;
  PasswordConfirmation: string;
}

export interface CreateReportRequest {
  Title: string;
  Type: 'LOST' | 'FOUND';
  CategoryId: string;
  Brand?: string;
  Color?: string;
  Description: string;
  Location: string;
  EventAt: string;
}

export interface UpdateReportRequest {
  Title?: string;
  CategoryId?: string;
  Brand?: string;
  Color?: string;
  Description?: string;
  Location?: string;
  EventAt?: string;
}

export interface SubmitClaimRequest {
  ProofAnswer: string;
  OwnershipDescription: string;
  ContactPhone: string;
}

export interface VerifyReportRequest {
  Status: 'OPEN' | 'REJECTED';
  ModeratorNote?: string;
}

export interface ChangeReportStatusRequest {
  Status: 'MATCHED' | 'CLAIMED' | 'RETURNED' | 'REJECTED' | 'ARCHIVED';
  ModeratorNote?: string;
}

export interface DecideClaimRequest {
  Status: 'APPROVED' | 'REJECTED';
  DecisionNote: string;
}

export interface RecordHandoverRequest {
  ReportId: string;
  ClaimId: string;
  RecipientName: string;
  HandoverLocation: string;
  Note?: string;
}
