import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

export default function SidebarComponent() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarMenuButton render={<Link to="/">Home</Link>} />
        <SidebarMenuButton render={<Link to="/dashboard">Dashboard</Link>} />
        <SidebarMenuButton render={<Link to="/signin">SignIn</Link>} />

        <SidebarMenuButton isActive>isActive btn</SidebarMenuButton>

        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter />
    </Sidebar>
  );
}
