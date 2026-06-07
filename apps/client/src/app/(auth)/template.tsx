"use client";
import { useEffect } from "react";

export default function FTamplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    console.log("Template rendered");
  }, []);
  return <>{children}</>;
}
