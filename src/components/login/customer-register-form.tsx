import { useState } from "react"

import { useAuth } from "@/components/login/authContext"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

import { useCustomerStore } from "@/store/customer-store"
import { uploadImageToAppwrite } from "@/service/appwriteStorage"
import { syncCustomerInAppwrite } from "@/service/appwriteCustomer"
import type { AuthUser } from "./authContext"

export function CustomerRegisterForm({
  onSuccess,
}: {
  onSuccess?: (user: AuthUser) => void
}) {
  const { login } = useAuth()
  const { registerCustomer } = useCustomerStore()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()
    const trimmedAddress = address.trim()
    const trimmedCity = city.trim()

    if (
      !trimmedFirstName ||
      !trimmedLastName ||
      !trimmedEmail ||
      !trimmedPhone ||
      !trimmedAddress ||
      !trimmedCity ||
      !password.trim()
    ) {
      toast.error("Please fill in all customer registration fields")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    try {
      const uploadedAvatar = avatarFile
        ? await uploadImageToAppwrite(avatarFile)
        : null

      const registeredCustomer = registerCustomer({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: trimmedAddress,
        city: trimmedCity,
        avatar: uploadedAvatar?.fileUrl,
        password: password.trim(),
      })

      await syncCustomerInAppwrite({
        firstName: registeredCustomer.firstName,
        lastName: registeredCustomer.lastName,
        email: registeredCustomer.email,
        phone: registeredCustomer.phone,
        address: registeredCustomer.address,
        city: registeredCustomer.city,
        avatar: registeredCustomer.avatar,
        password: registeredCustomer.password,
      })

      const userData: AuthUser = {
        name: `${registeredCustomer.firstName} ${registeredCustomer.lastName}`.trim(),
        email: registeredCustomer.email,
        role: "customer",
        avatar: registeredCustomer.avatar,
      }

      login(userData)
      toast.success("Customer account created")
      onSuccess?.(userData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create customer account")
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleRegister}>
      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="registerEmail">Email</FieldLabel>
          <Input id="registerEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
            <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="customer-avatar">Profile Image (optional)</FieldLabel>
          <div className="flex items-end gap-2">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile preview"
                className="h-16 w-16 rounded-md border object-cover"
              />
            ) : null}
            <Input
              id="customer-avatar"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setAvatarFile(file)

                if (file) {
                  setAvatarPreview(URL.createObjectURL(file))
                } else {
                  setAvatarPreview(null)
                }
              }}
            />
          </div>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="registerPassword">Password</FieldLabel>
            <Input id="registerPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </Field>
        </div>
        <Field>
          <Button type="submit">Create Customer Account</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}