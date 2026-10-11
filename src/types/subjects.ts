import type { UUID, Division, Status } from "./common";

export type Subject = {
  id: UUID;
  code: string; // e.g. "MATH", "ENG", "SCI"
  name: string; // e.g. "Mathematics"
  divisions: Division[]; // which divisions take this subject
  isCore: boolean; // core vs elective
  description?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type SubjectFormValues = {
  code: string;
  name: string;
  divisions: Division[];
  isCore: boolean;
  description?: string;
  status: Status;
};

export type SubjectFilters = {
  search?: string;
  division?: Division | "all";
  status?: Status | "all";
};
