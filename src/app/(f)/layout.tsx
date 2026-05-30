import Link from "next/link";

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
        <ul className="mt-4 flex flex-col items-center justify-center border-b border-gray-700 pb-2">
          {links.map((link) => (
            <li key={link.href} className="text-blue-500 hover:underline">
              <Link href={link.href} className="hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {children}
    </div>
  );
}
