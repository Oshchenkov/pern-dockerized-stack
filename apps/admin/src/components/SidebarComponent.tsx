import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

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
        <SidebarMenuButton
          render={
            <a href={"#"}>
              <span>fdgfg</span>
            </a>
          }
        >
          44
        </SidebarMenuButton>
        <SidebarMenuButton isActive>Btn</SidebarMenuButton>

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
