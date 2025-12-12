// Kernel entity types - shared across all modules

export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityWithSpace extends Entity {
  spaceId: string;
}

export type EntityType =
  | "Invoice"
  | "Receipt"
  | "Client"
  | "TaxPeriod"
  | "Task"
  | "InboxItem"
  | "File";

export interface EntityReference {
  type: EntityType;
  id: string;
}
