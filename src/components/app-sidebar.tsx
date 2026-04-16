import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  CreditCardIcon,
  FileBarChart2Icon,
  WalletIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  CommandIcon,
  BoxesIcon,
  UsersIcon,
  ShoppingCartIcon,
  HandCoinsIcon,
  ReceiptTextIcon,
} from "lucide-react"
import { ThemeSwitch } from "./themeswitcher"
import { useAuth } from "./login/authContext"
import type { UserRole } from "@/types/tabledata"

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  roles: UserRole[]
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <LayoutDashboardIcon
        />
      ),
      roles: ["admin", "shopAdmin"] as UserRole[],
    },
    {
      title: "Shops",
      url: "/shop",
      icon: (
        <ListIcon
        />
      ),
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Products",
      url: "/products",
      icon: (
        <ChartBarIcon
        />
      ),
      roles: ["admin", "shopAdmin"] as UserRole[],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: <BoxesIcon />,
      roles: ["shopAdmin"] as UserRole[],
    },
    {
      title: "Sales",
      url: "/sales",
      icon: <ShoppingCartIcon />,
      roles: ["shopAdmin"] as UserRole[],
    },
    {
      title: "Customers",
      url: "/customers",
      icon: <UsersIcon />,
      roles: ["shopAdmin"] as UserRole[],
    },
    {
      title: "Purchase",
      url: "/purchase",
      icon: <HandCoinsIcon />,
      roles: ["shopAdmin"] as UserRole[],
    },
    {
      title: "Expense",
      url: "/expense",
      icon: <ReceiptTextIcon />,
      roles: ["shopAdmin"] as UserRole[],
    },
    {
      title: "Payment",
      url: "/payment",
      icon: (
        <CreditCardIcon
        />
      ),
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Plans",
      url: "/plans",
      icon: (
        <WalletIcon
        />
      ),
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: (
        <FileBarChart2Icon
        />
      ),
      roles: ["admin", "shopAdmin"] as UserRole[],
    },
  ] as NavItem[],
  navSecondary: [
    {
      title: "Settings",
      url: "/setting",
      icon: (
        <Settings2Icon
        />
      ),
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <CircleHelpIcon
        />
      ),
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <SearchIcon
        />
      ),
      roles: ["admin"] as UserRole[],
    },
  ] as NavItem[],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const currentRole: UserRole = user?.role === "admin" ? "admin" : "shopAdmin"

  const navMain = data.navMain.filter((item) => item.roles.includes(currentRole))
  const navSecondary = data.navSecondary.filter((item) => item.roles.includes(currentRole))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold group-data-[collapsible=icon]:hidden flex flex-rows items-center gap-2">
                  Acme Inc.
                  <ThemeSwitch />
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {navSecondary.length ? (
          <NavSecondary items={navSecondary} className="mt-auto" />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name ?? "User",
            email: user?.email ?? "",
            avatar: user?.avatar ?? "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
