import { useAuth } from "@/components/login/authContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { designTokens } from "@/components/ui/design-tokens"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, ChevronDown, Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router"

export function SiteHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const displayName = user?.name?.trim() || "User"
  const firstName = displayName.split(" ")[0] || "U"

  const searchParams = new URLSearchParams(location.search)
  const headerSearchValue = searchParams.get("q") ?? ""

  const updateHeaderSearch = (value: string) => {
    const nextParams = new URLSearchParams(location.search)

    if (value.trim()) {
      nextParams.set("q", value)
    } else {
      nextParams.delete("q")
    }

    const nextSearch = nextParams.toString()
    navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`, {
      replace: true,
    })
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <div className="flex w-full items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={headerSearchValue}
              onChange={(event) => updateHeaderSearch(event.target.value)}
              placeholder="Search products, sales, customers..."
              className={`h-10 ${designTokens.radius.base} ${designTokens.colors.border} ${designTokens.colors.bgMuted} ${designTokens.effects.noShadow} ${designTokens.effects.noFocus} pl-9`}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <Button
              variant="outline"
              className={`h-10 w-10 ${designTokens.radius.base} ${designTokens.colors.border} ${designTokens.colors.bgSurface} ${designTokens.effects.noShadow} ${designTokens.effects.noFocus}`}
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex h-10 items-center gap-2 ${designTokens.radius.base} border ${designTokens.colors.border} ${designTokens.colors.bgSurface} ${designTokens.spacing.compact} text-left ${designTokens.effects.noShadow} ${designTokens.effects.noFocus} transition hover:border-indigo-300 dark:hover:border-white/20`}>
                  <div className={`flex size-7 items-center justify-center ${designTokens.radius.base} bg-linear-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white`}>
                    {firstName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <p className={`truncate text-sm font-semibold ${designTokens.colors.textPrimary}`}>{displayName}</p>
                  </div>
                  <ChevronDown className="size-4 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-xl border-slate-300 shadow-xl" align="end">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/setting")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    logout()
                    navigate("/")
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
