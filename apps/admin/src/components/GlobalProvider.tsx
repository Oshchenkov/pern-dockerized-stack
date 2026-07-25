import { TooltipProvider } from "@/components/ui/tooltip";

export default function GlobalProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TooltipProvider>{children}</TooltipProvider>
    </>
  );
}
