import Link from "next/link";

const links = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/products",
    label: "Products",
  },
  {
    href: "/products/1",
    label: "Product 1",
  },
  {
    href: "/products/1/reviews/2",
    label: "Pr Rew 1 - 2",
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
  {
    href: "/f1/f2/inner-f2",
    label: "F2 inner",
  },
];

const links2 = [
  {
    href: "/login",
    label: "Login",
  },
  {
    href: "/register",
    label: "Register",
  },
  {
    href: "/forgot-password",
    label: "Forgot Password",
  },
];

export default function Header() {
  return (
    <header className="w-full bg-gray-800 text-white p-4">
      <div className="text-xl font-bold">Basic</div>
      <ul className="mt-4 border-b border-gray-700 pb-2">
        {links.map((link) => (
          <li key={link.href} className="inline-block mx-2">
            <Link href={link.href} className="hover:underline">
              {link.label}
            </Link>{" "}
            |
          </li>
        ))}
      </ul>

      <div className="my-4">
        <div className="text-xl font-bold">Auth</div>
        <ul className="mt-4 border-b border-gray-700 pb-2">
          {links2.map((link) => (
            <li key={link.href} className="inline-block mx-2">
              <Link href={link.href} className="hover:underline">
                {link.label}
              </Link>{" "}
              |
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
