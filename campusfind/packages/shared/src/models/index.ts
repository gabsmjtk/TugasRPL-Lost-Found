import { Role, ReportType, ReportStatus, ClaimStatus } from '../enums';

export interface UserSummary {
  Id: string;
  Name: string;
  Email: string;
  StudentNumber: string | null;
  Role: Role;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Category {
  Id: string;
  Name: string;
  Description: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ReportImage {
  Id: string;
  ReportId: string;
  FileName: string;
  FilePath: string;
  MimeType: string;
  SortOrder: number;
  CreatedAt: string;
}

export interface ReportSummary {
  Id: string;
  Type: ReportType;
  Status: ReportStatus;
  Title: string;
  CategoryId: string;
  CategoryName: string;
  Location: string;
  EventAt: string;
  CreatedAt: string;
  UpdatedAt: string;
  ImageUrl?: string;
}

export interface ReportDetail {
  Id: string;
  ReporterId: string;
  ReporterName: string; // Only first name and initial publicly
  CategoryId: string;
  CategoryName: string;
  Type: ReportType;
  Status: ReportStatus;
  Title: string;
  Brand: string | null;
  Color: string | null;
  Description: string;
  Location: string;
  EventAt: string;
  VerifiedAt: string | null;
  ModeratorNote: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  Images: ReportImage[];
  SimilarReports: ReportSummary[]; // Used when fetching details
}

export interface ClaimSummary {
  Id: string;
  ReportId: string;
  ReportTitle: string;
  ClaimantId: string;
  ClaimantName: string;
  ProofAnswer: string;
  OwnershipDescription: string;
  ContactPhone: string;
  Status: ClaimStatus;
  DecisionNote: string | null;
  DecidedAt: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Handover {
  Id: string;
  ReportId: string;
  ClaimId: string;
  AdminId: string;
  RecipientName: string;
  HandoverLocation: string;
  HandedOverAt: string;
  Note: string | null;
  CorrectionNote: string | null;
  CreatedAt: string;
}
