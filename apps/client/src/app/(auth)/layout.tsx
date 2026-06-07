"use client";

import Navigation from "@/components/Navigation";
import { useEffect } from "react";

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
  useEffect(() => {
    console.log("Layout rendered");
  }, []);
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col">
        <Navigation links={links} />
      </div>
      {children}
    </div>
  );
}
