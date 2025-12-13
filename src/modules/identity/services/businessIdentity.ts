import { db } from "@/lib/db";
import { uploadFile, deleteFile, getFileUrl } from "@/lib/storage";
import type { BusinessIdentityResponse, UpsertBusinessIdentityInput } from "../entities";

function validateVatId(vatId?: string | null, country?: string | null): string | null {
  if (!vatId) return null;
  const cleanedCountry = country?.toUpperCase();
  // Simple, soft validation: EU-style VAT starts with 2 letters followed by alphanumerics
  const euPattern = /^[A-Z]{2}[A-Z0-9]{6,12}$/;
  const genericPattern = /^[A-Z0-9][A-Z0-9\-]{3,}$/;

  if (cleanedCountry === "DE" || cleanedCountry === "FR" || cleanedCountry === "ES" || cleanedCountry === "IT") {
    return euPattern.test(vatId.replace(/\s+/g, "").toUpperCase())
      ? null
      : "VAT ID format looks off for EU format (expected 2 letters + 6-12 chars). Saved anyway.";
  }

  return genericPattern.test(vatId.replace(/\s+/g, "").toUpperCase())
    ? null
    : "VAT ID format looks off. Saved anyway.";
}

export async function listBusinessIdentities(spaceId: string) {
  return db.businessIdentity.findMany({
    where: { spaceId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function upsertBusinessIdentity(
  spaceId: string,
  input: UpsertBusinessIdentityInput,
  logoFile?: File | null
): Promise<BusinessIdentityResponse> {
  const warnings: string[] = [];

  const vatWarning = validateVatId(input.vatId, input.addressCountry);
  if (vatWarning) warnings.push(vatWarning);

  let logoUrl = input.logoUrl ?? null;
  let previousLogo: string | null = null;

  if (logoFile) {
    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(logoFile.type)) {
      throw new Error("Logo must be PNG, JPG, or SVG");
    }
    if (logoFile.size > 2 * 1024 * 1024) {
      throw new Error("Logo file must be under 2MB");
    }
  }

  const existing = input.id
    ? await db.businessIdentity.findFirst({ where: { id: input.id, spaceId } })
    : null;
  if (existing) {
    previousLogo = existing.logoUrl;
  }

  if (logoFile) {
    const storageKey = await uploadFile(spaceId, logoFile, "identity-logos");
    logoUrl = await getFileUrl(storageKey);
  } else if (input.logoUrl === null && existing?.logoUrl) {
    // Explicit removal requested
    previousLogo = existing.logoUrl;
    logoUrl = null;
  }

  const data = {
    legalName: input.legalName,
    tradeName: input.tradeName,
    addressStreet: input.addressStreet,
    addressZip: input.addressZip,
    addressCity: input.addressCity,
    addressCountry: input.addressCountry,
    vatId: input.vatId,
    taxNumber: input.taxNumber,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    contactWebsite: input.contactWebsite,
    logoUrl,
    paymentInstructions: input.paymentInstructions,
    isDefault: !!input.isDefault,
  };

  const identity = await db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.businessIdentity.updateMany({
        where: { spaceId },
        data: { isDefault: false },
      });
    }

    const result = existing
      ? await tx.businessIdentity.update({
          where: { id: existing.id },
          data,
        })
      : await tx.businessIdentity.create({
          data: { spaceId, ...data },
        });

    return result;
  });

  // Cleanup old logo if replaced/removed
  if (previousLogo && previousLogo !== logoUrl) {
    const key = previousLogo.replace("/api/files/", "");
    await deleteFile(key).catch(() => undefined);
  }

  return { identity, warnings: warnings.length ? warnings : undefined };
}

export async function deleteBusinessIdentity(spaceId: string, id: string) {
  const identity = await db.businessIdentity.findFirst({ where: { id, spaceId } });
  if (!identity) return;
  await db.businessIdentity.delete({ where: { id } });
  if (identity.logoUrl) {
    const key = identity.logoUrl.replace("/api/files/", "");
    await deleteFile(key).catch(() => undefined);
  }
}

export async function getDefaultBusinessIdentity(spaceId: string) {
  return db.businessIdentity.findFirst({
    where: { spaceId, isDefault: true },
    orderBy: { updatedAt: "desc" },
  });
}
