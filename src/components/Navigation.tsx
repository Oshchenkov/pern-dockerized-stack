import Link from "next/link";

export default function Navigation({
  links,
}: Readonly<{
  links: {
    href: string;
    label: string;
  }[];
}>) {
  return (
    <nav className="mt-4 flex flex-row items-center justify-center border-b border-gray-700 pb-2">
      {links.map((link, idx) => (
        <Link
          href={link.href}
          key={link.href}
          className="text-blue-500 hover:underline mx-4 p-2"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
