import PageTemplate from "@/components/PageTemplate";
import Navigation from "@/components/Navigation";

const links = [
  {
    href: "/api/v1/users",
    label: "Users",
  },
  {
    href: "/api/v1/comments",
    label: "Comments",
  },
];

export default function ApiMenuPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col mb-8">
        <Navigation links={links} />
      </div>
      <PageTemplate>Api Menu page</PageTemplate>
    </div>
  );
}
