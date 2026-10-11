export type UUID = string;

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ID = string;

export type Status = "active" | "inactive" | "archived";

export type Division = "nursery" | "kg" | "primary" | "jhs";

export type Gender = "male" | "female";

export type SortDirection = "asc" | "desc";
