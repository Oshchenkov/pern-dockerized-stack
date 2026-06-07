import Link from "next/link";
import Navigation from "@/components/Navigation";

const links = [
  {
    href: "/f1",
    label: "F1",
  },
  {
    href: "/f1/f2",
    label: "F2",
  },
  {
    href: "/f1/f2/inner-f2",
    label: "F2 inner",
  },
  {
    href: "/f3",
    label: "F3",
  },
  {
    href: "/f4",
    label: "F4",
  },
  {
    href: "/f5",
    label: "F5",
  },
];

export default function FLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col">
        <Navigation links={links} />
      </div>
      {children}
    </div>
  );
}
