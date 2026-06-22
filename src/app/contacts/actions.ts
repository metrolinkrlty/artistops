"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getContacts() {
  return prisma.contact.findMany({ orderBy: { name: "asc" } });
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
  const data = parse(formData);
  if (!data.name) return;
  await prisma.contact.create({ data });
  revalidatePath("/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  const data = parse(formData);
  if (!data.name) return;
  await prisma.contact.update({ where: { id }, data });
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
}
