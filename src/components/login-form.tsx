import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "./login/authContext"
import { useShopStore } from "@/store/shop-store"
import { useCustomerStore } from "@/store/customer-store"
import { useNavigate } from "react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import type { AuthUser } from "./login/authContext"
import {
  loginMainAdminWithAppwrite,
  mainAdminEmail,
  sendPasswordRecoveryEmailByEmail,
} from "@/service/appwriteAuth"
import { loginShopAdminWithAppwrite } from "@/service/appwriteShop"
import {
  syncCustomerInAppwrite,
} from "@/service/appwriteCustomer"

export function LoginForm({
  className,
  showHeading = true,
  onSuccess,
  ...props
}: React.ComponentProps<"form"> & { showHeading?: boolean; onSuccess?: (user: AuthUser) => void }) {
  const { login } = useAuth()
  const { shops } = useShopStore()
  const { authenticateCustomer, findCustomerByEmailOrPhone } = useCustomerStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false)
  const [forgotIdentifier, setForgotIdentifier] = useState("")
  const [recoverySent, setRecoverySent] = useState(false)

  const resetForgotPasswordState = () => {
    setForgotIdentifier("")
    setRecoverySent(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPassword = password.trim()

    if (normalizedEmail === mainAdminEmail) {
      try {
        const appwriteAdmin = await loginMainAdminWithAppwrite(
          normalizedEmail,
          normalizedPassword,
        )

        const userData = {
          name: appwriteAdmin.name,
          email: appwriteAdmin.email,
          role: "admin",
        } as AuthUser

        login(userData)
        onSuccess ? onSuccess(userData) : navigate("/dashboard")
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Main admin login failed")
        return
      }
    }

    try {
      const appwriteShopAdmin = await loginShopAdminWithAppwrite(
        normalizedEmail,
        normalizedPassword,
      )

      const userData = {
        name: appwriteShopAdmin.name,
        email: appwriteShopAdmin.email,
        role: "shopAdmin",
        avatar: appwriteShopAdmin.avatar,
      } as AuthUser

      login(userData)
      onSuccess ? onSuccess(userData) : navigate("/dashboard")
      return
    } catch (error) {
      const isKnownShop = shops.some(
        (shop) => shop.email.toLowerCase() === normalizedEmail,
      )

      if (isKnownShop) {
        toast.error(error instanceof Error ? error.message : "Shop admin login failed")
        return
      }
    }

    const matchingCustomer = authenticateCustomer(normalizedEmail, normalizedPassword)

    if (matchingCustomer) {
      try {
        await syncCustomerInAppwrite({
          firstName: matchingCustomer.firstName,
          lastName: matchingCustomer.lastName,
          email: matchingCustomer.email,
          phone: matchingCustomer.phone,
          address: matchingCustomer.address,
          city: matchingCustomer.city,
          avatar: matchingCustomer.avatar,
          password: normalizedPassword,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to sync customer account in Appwrite")
        return
      }

      const userData = {
        name: `${matchingCustomer.firstName} ${matchingCustomer.lastName}`.trim(),
        email: matchingCustomer.email,
        role: "customer",
        avatar: matchingCustomer.avatar,
      } as AuthUser

      login(userData)
      onSuccess ? onSuccess(userData) : navigate("/")
      return
    }

    if (normalizedEmail.includes("@") && normalizedEmail !== mainAdminEmail) {
      toast.error(`Invalid credentials. For admin login, use ${mainAdminEmail}`)
      return
    }

    toast.error("Invalid credentials")
  }

  const maskIdentifier = (value: string) => {
    const trimmed = value.trim()

    if (trimmed.includes("@")) {
      const [name, domain] = trimmed.split("@")
      const safeName = name.length > 2 ? `${name.slice(0, 2)}***` : "***"
      return `${safeName}@${domain}`
    }

    const digits = trimmed.replace(/\D/g, "")
    if (digits.length < 4) {
      return "***"
    }

    return `***${digits.slice(-4)}`
  }

  const handleSendForgotOtp = async () => {
    const normalizedIdentifier = forgotIdentifier.trim().toLowerCase()

    if (!normalizedIdentifier || !normalizedIdentifier.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    const isAdminMatch = normalizedIdentifier === mainAdminEmail
    const isShopMatch = shops.some((shop) => shop.email.toLowerCase() === normalizedIdentifier)
    const isCustomerMatch = Boolean(findCustomerByEmailOrPhone(normalizedIdentifier))

    const accountTypeLabel = isAdminMatch
      ? "admin"
      : isShopMatch
      ? "shop"
      : isCustomerMatch
      ? "customer"
      : "account"

    if (!isAdminMatch && !isShopMatch && !isCustomerMatch) {
      toast.error("No account found with this email")
      return
    }

    try {
      await sendPasswordRecoveryEmailByEmail(normalizedIdentifier)
      setRecoverySent(true)
      toast.success(`Recovery email sent to ${maskIdentifier(normalizedIdentifier)} (${accountTypeLabel})`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send recovery email"
      if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("user_not_found")) {
        toast.error("No account found with this email")
        return
      }

      toast.error(message)
    }
  }

  return (
    <>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        <FieldGroup>
          {showHeading ? (
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">Login to your account</h1>
              <p className="text-sm text-balance text-muted-foreground">
                Enter your email below to login to your account
              </p>
            </div>
          ) : null}
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
                onClick={() => {
                  setForgotDialogOpen(true)
                }}
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

      <Dialog
        open={forgotDialogOpen}
        onOpenChange={(open) => {
          setForgotDialogOpen(open)

          if (!open) {
            resetForgotPasswordState()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              We will send a recovery link to your email so you can set a new password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="forgot-identifier">Email</FieldLabel>
              <Input
                id="forgot-identifier"
                value={forgotIdentifier}
                onChange={(event) => setForgotIdentifier(event.target.value)}
                placeholder="Enter your account email"
              />
            </Field>

            {recoverySent ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Recovery email sent. Open the link in that email to set a new password.
              </div>
            ) : null}

            <Button type="button" className="w-full" onClick={handleSendForgotOtp}>
              Send Recovery Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
