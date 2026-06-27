import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AddPlaceForm } from "@/components/AddPlaceForm";

export default async function AdminPlacesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  const cities = await prisma.city.findMany({
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Link href="/admin" className="text-sm text-neutral-500 hover:text-rose-600">← Moderation</Link>
      <h1 className="mt-2 text-2xl font-bold">➕ Add a place</h1>
      <p className="mt-1 text-sm text-neutral-500">
        After saving, open the place to add dishes and foreigner-friendly tags.
      </p>
      <div className="mt-6">
        <AddPlaceForm cities={cities} />
      </div>
    </div>
  );
}
