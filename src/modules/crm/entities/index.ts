import { Client } from "@prisma/client";

export type { Client };

export interface CreateClientInput {
  name: string;
  email?: string;
  vatId?: string;
  address?: string;
}

export interface ClientFilters {
  search?: string;
}
