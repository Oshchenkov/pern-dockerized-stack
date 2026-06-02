import PageTemplate from "@/components/PageTemplate";
import Navigation from "@/components/Navigation";

const links = [
  {
    href: "/api/v1/comments",
    label: "Comments All",
  },
  {
    href: "/api/v1/comments?query=ir",
    label: "Comments query=ir",
  },
  {
    href: "/api/v1/comments?query=1",
    label: "Comments query=1",
  },
  {
    href: "/api/v1/users",
    label: "Users",
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
