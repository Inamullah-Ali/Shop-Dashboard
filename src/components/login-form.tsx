import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "./login/authContext"
import { useShopStore } from "@/store/shop-store"
import { useNavigate } from "react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

const ADMIN_CREDENTIALS = {
  email: "admin@gmail.com",
  password: "Admin@123",
} as const

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { login } = useAuth()
  const { shops } = useShopStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPassword = password.trim()

    if (
      normalizedEmail === ADMIN_CREDENTIALS.email &&
      normalizedPassword === ADMIN_CREDENTIALS.password
    ) {
      login({
        name: "System Admin",
        email: ADMIN_CREDENTIALS.email,
        role: "admin",
      })
      navigate("/dashboard")
      return
    }

    const matchingShop = shops.find(
      (shop) =>
        shop.email.toLowerCase() === normalizedEmail &&
        (shop.password ?? "") === normalizedPassword,
    )

    if (matchingShop) {
      login({
        name: matchingShop.ownerName,
        email: matchingShop.email,
        role: "shopAdmin",
      })
      navigate("/dashboard")
      return
    }

    toast.error("Invalid credentials")
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <button
              type="button"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              className="bg-background pr-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </Field>
        <Field>
          <Button type="submit">Login</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
