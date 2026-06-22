import SidebarComponent from "@/components/SidebarComponent";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_rootLayout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <SidebarComponent />
      <main className="relative w-full pl-8 pr-6 py-6">
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
