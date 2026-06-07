import Card from "@/components/Card";
import PageTemplate from "@/components/PageTemplate";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <Card>
      <div className="flex flex-col">
        <PageTemplate>Notifications page</PageTemplate>
        <div className="mt-4 text-gray-600 dark:text-gray-400">
          <Link
            href="/dashboard/archive"
            className="text-blue-500 hover:underline"
          >
            Archive
          </Link>
        </div>
      </div>
    </Card>
  );
}
