import { useState } from "react"

import { CustomerRegisterForm } from "@/components/login/customer-register-form"
import { LoginForm } from "@/components/login-form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate } from "react-router"
import type { AuthUser } from "@/components/login/authContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type LoginDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  onAuthSuccess?: (user: AuthUser) => void
}

export function LoginDialog({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  onAuthSuccess,
}: LoginDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const navigate = useNavigate()

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const handleSuccess = (user: AuthUser) => {
    setOpen(false)
    onAuthSuccess?.(user)

    if (user.role === "admin" || user.role === "shopAdmin") {
      navigate("/dashboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button className="shadow-sm">Login</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Login / Register</DialogTitle>
          <DialogDescription>
            Sign in as an Admin, Shop Admin, or Customer. Customer registration is available here.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <LoginForm className="pt-2" showHeading={false} onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="register" className="pt-4">
            <CustomerRegisterForm
              onSuccess={(user) => {
                handleSuccess(user)
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}