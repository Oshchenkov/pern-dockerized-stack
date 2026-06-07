import Card from "@/components/Card";
import PageTemplate from "@/components/PageTemplate";
import Link from "next/link";

export default function ArchivePage() {
  return (
    <Card>
      <div className="flex flex-col">
        <PageTemplate>Archive page</PageTemplate>
        <div className="mt-4 text-gray-600 dark:text-gray-400">
          <Link href="/dashboard" className="text-blue-500 hover:underline">
            Dashboard default
          </Link>
        </div>
      </div>
    </Card>
  );
}
