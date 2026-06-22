import Header from "@/components/layout/Header";
import { getContacts } from "./actions";
import ContactsClient from "./ContactsClient";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await getContacts();
  return (
    <div className="flex-1">
      <Header title="Contacts" subtitle="Manage your industry network" />
      <ContactsClient contacts={JSON.parse(JSON.stringify(contacts))} />
    </div>
  );
}
