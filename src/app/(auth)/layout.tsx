import Link from "next/link";
import Navigation from "@/components/Navigation";

const links = [
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
