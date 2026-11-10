import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Narrow, Skeleton } from "@/components/chrome";
import { ImportForm } from "./import-form";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <Narrow>
      <Suspense fallback={<Skeleton />}>
        <Gate />
      </Suspense>
    </Narrow>
  );
}

async function Gate() {
  await connection();
  if (!process.env.ADMIN_TOKEN) notFound();
  return (
    <>
      <h1 className="mb-2 text-4xl font-semibold">Import sticker codes</h1>
      <p className="hint mb-8">Registers the codes on your printed stickers so owners can activate them.</p>
      <ImportForm />
    </>
  );
}
