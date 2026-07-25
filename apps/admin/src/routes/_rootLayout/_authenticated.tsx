import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_rootLayout/_authenticated")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      authenticated"!
      <Outlet />
    </div>
  );
}
