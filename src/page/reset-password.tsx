import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { confirmMainAdminPasswordRecovery } from "@/service/appwriteAuth"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const userId = searchParams.get("userId") ?? ""
  const secret = searchParams.get("secret") ?? ""

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!userId || !secret) {
      toast.error("The recovery link is missing required parameters.")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    try {
      setLoading(true)
      await confirmMainAdminPasswordRecovery({
        userId,
        secret,
        password,
      })
      toast.success("Password changed successfully. Please log in again.")
      navigate("/", { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Set a new admin password</CardTitle>
          <CardDescription>
            Enter the password from the recovery link email to complete the reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}