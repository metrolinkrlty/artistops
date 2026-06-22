"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getContacts() {
  const userId = await requireUserId();
  return prisma.contact.findMany({ where: { userId }, orderBy: { name: "asc" } });
}

function parse(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    role: String(formData.get("role") || "").trim() || "producer",
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    company: String(formData.get("company") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

export async function createContact(formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.name) return;
  await prisma.contact.create({ data: { ...data, userId } });
  revalidatePath("/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = parse(formData);
  if (!data.name) return;
  await prisma.contact.updateMany({ where: { id, userId }, data });
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const userId = await requireUserId();
  await prisma.contact.deleteMany({ where: { id, userId } });
  revalidatePath("/contacts");
}
