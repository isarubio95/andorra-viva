import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { ADMIN_NAV_ITEMS } from '@/constants/admin-nav';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, displayName } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Sesión cerrada' });
    navigate('/');
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1">
            <AppLogo size="xs" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">Administración</span>
              <span className="text-xs text-muted-foreground">Andorra Viva</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menú</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV_ITEMS.map(item => {
                  const active =
                    item.href === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.href}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Volver al sitio">
                <Link to="/">
                  <ArrowLeft />
                  <span>Volver al sitio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => void handleSignOut()} tooltip="Cerrar sesión">
                <LogOut />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <p className="truncate px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {displayName}
          </p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between gap-4">
            <h1 className="text-sm font-medium text-muted-foreground">
              {ADMIN_NAV_ITEMS.find(
                item =>
                  item.href === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.href),
              )?.title ?? 'Panel admin'}
            </h1>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Ver web</Link>
            </Button>
          </div>
        </header>
        <main className={cn('flex-1 p-4 md:p-6')}>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
