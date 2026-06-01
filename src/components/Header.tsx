import Navigation from "./Navigation";

const links = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/gallery",
    label: "Gallery",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/login",
    label: "Login",
  },
  {
    href: "/products",
    label: "Products",
  },
  {
    href: "/docs/sdfdsf/223/444?sdfsdf=3232#heshvalue2",
    label: "Docs",
  },
  {
    href: "/_dash",
    label: "Dash",
  },
  {
    href: "/f1",
    label: "F1",
  },
];

export default function Header() {
  return (
    <header className="w-full bg-gray-800 text-white">
      <Navigation links={links} />
    </header>
  );
}
