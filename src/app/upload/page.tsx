import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UploadForm from "@/components/UploadForm";

export default async function UploadPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ATHLETE") redirect("/coach");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <UploadForm />
    </div>
  );
}
