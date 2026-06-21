import { createFileRoute } from "@tanstack/react-router";
import { Button, buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/_mainLayout/")({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
      <Button className={buttonVariants({ size: "lg", className: "m-4" })}>
        Btn
      </Button>
      Here
    </div>
  );
}
