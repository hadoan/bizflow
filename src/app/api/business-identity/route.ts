import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithSpace } from "@/lib/auth";
import {
  deleteBusinessIdentity,
  listBusinessIdentities,
  upsertBusinessIdentity,
} from "@/modules/identity/services";

function parseBoolean(value: FormDataEntryValue | null): boolean | undefined {
  if (value === null) return undefined;
  const str = value.toString().toLowerCase();
  return str === "true" || str === "1" || str === "on";
}

async function parseBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    const rawLogoUrl = formData.get("logoUrl");
    const logoUrl = rawLogoUrl !== null && rawLogoUrl.toString() === "" ? null : rawLogoUrl?.toString();
    return {
      payload: {
        id: formData.get("id")?.toString(),
        legalName: formData.get("legalName")?.toString() ?? "",
        tradeName: formData.get("tradeName")?.toString() || undefined,
        addressStreet: formData.get("addressStreet")?.toString() || undefined,
        addressZip: formData.get("addressZip")?.toString() || undefined,
        addressCity: formData.get("addressCity")?.toString() || undefined,
        addressCountry: formData.get("addressCountry")?.toString() || undefined,
        vatId: formData.get("vatId")?.toString() || undefined,
        taxNumber: formData.get("taxNumber")?.toString() || undefined,
        contactEmail: formData.get("contactEmail")?.toString() || undefined,
        contactPhone: formData.get("contactPhone")?.toString() || undefined,
        contactWebsite: formData.get("contactWebsite")?.toString() || undefined,
        paymentInstructions: formData.get("paymentInstructions")?.toString() || undefined,
        isDefault: parseBoolean(formData.get("isDefault")),
        logoUrl,
      },
      file,
    };
  }

  const json = await req.json();
  return { payload: json, file: null };
}

export async function GET() {
  try {
    const { space } = await getCurrentUserWithSpace();
    const identities = await listBusinessIdentities(space.id);
    return NextResponse.json(identities);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch identities";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { payload, file } = await parseBody(req);

    if (!payload.legalName || typeof payload.legalName !== "string") {
      return NextResponse.json({ error: "Legal name is required" }, { status: 400 });
    }

    const result = await upsertBusinessIdentity(space.id, payload, file);
    return NextResponse.json(result, { status: payload.id ? 200 : 201 });
  } catch (error) {
    console.error("Business identity save error:", error);
    const message = error instanceof Error ? error.message : "Failed to save identity";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Identity id is required" }, { status: 400 });
    }
    await deleteBusinessIdentity(space.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Business identity delete error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete identity";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
