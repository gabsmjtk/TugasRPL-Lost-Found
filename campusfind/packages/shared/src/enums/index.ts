export enum Role {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum ReportType {
  LOST = 'LOST',
  FOUND = 'FOUND'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  CLAIMED = 'CLAIMED',
  RETURNED = 'RETURNED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
