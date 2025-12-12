import { db } from "@/lib/db";
import type { CreateClientInput, ClientFilters, Client } from "../entities";

export async function createClient(spaceId: string, input: CreateClientInput): Promise<Client> {
  return await db.client.create({
    data: {
      spaceId,
      name: input.name,
      email: input.email,
      vatId: input.vatId,
      address: input.address,
    },
  });
}

export async function listClients(spaceId: string, filters?: ClientFilters): Promise<Client[]> {
  const where: any = { spaceId };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return await db.client.findMany({
    where,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getClient(spaceId: string, clientId: string): Promise<Client | null> {
  return await db.client.findFirst({
    where: {
      id: clientId,
      spaceId,
    },
  });
}

export async function updateClient(
  spaceId: string,
  clientId: string,
  updates: Partial<CreateClientInput>
): Promise<Client> {
  return await db.client.update({
    where: {
      id: clientId,
      spaceId,
    },
    data: updates,
  });
}

export async function deleteClient(spaceId: string, clientId: string): Promise<void> {
  await db.client.delete({
    where: {
      id: clientId,
      spaceId,
    },
  });
}
