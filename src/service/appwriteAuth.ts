import { appwriteAccount } from "@/lib/appwrite";
import { ID } from "appwrite";

const normalizeEnvValue = (value?: string) =>
  value?.trim().replace(/^['\"]|['\"]$/g, "") || "";

const configuredAdminEmail = normalizeEnvValue(import.meta.env.VITE_APPWRITE_MAIN_ADMIN_EMAIL).toLowerCase();

export const mainAdminEmail = configuredAdminEmail || "anamullahali9@gmail.com";

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown Appwrite error";
};

const isAccountAlreadyExistsError = (error: unknown) => {
  const message = toErrorMessage(error).toLowerCase();
  return (
    message.includes("already exists") ||
    message.includes("already registered") ||
    message.includes("409")
  );
};

const getAdminRecoveryUrl = () => {
  if (typeof window === "undefined") {
    return "/reset-password";
  }

  return `${window.location.origin}/reset-password`;
};

export async function sendMainAdminPasswordResetOtp() {
  const token = await appwriteAccount.createEmailToken(ID.unique(), mainAdminEmail, false);

  return {
    userId: token.userId,
  };
}

export async function requestPasswordResetOtpByEmail(email: string) {
  const normalizedEmail = normalizeEnvValue(email).toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required to send OTP.");
  }

  const token = await appwriteAccount.createEmailToken(ID.unique(), normalizedEmail, false);

  return {
    email: normalizedEmail,
    userId: token.userId,
  };
}

export async function sendPasswordRecoveryEmailByEmail(email: string) {
  const normalizedEmail = normalizeEnvValue(email).toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required to send a recovery link.");
  }

  await appwriteAccount.createRecovery(normalizedEmail, getAdminRecoveryUrl());
}

export async function sendMainAdminPasswordRecoveryEmail() {
  await appwriteAccount.createRecovery(mainAdminEmail, getAdminRecoveryUrl());
}

export async function confirmMainAdminPasswordRecovery(params: {
  userId: string;
  secret: string;
  password: string;
}) {
  await appwriteAccount.updateRecovery(params.userId, params.secret.trim(), params.password.trim());
}

export async function confirmMainAdminPasswordReset(params: {
  userId: string;
  otp: string;
  password: string;
}) {
  await appwriteAccount.createSession(params.userId, params.otp.trim());

  try {
    await appwriteAccount.updatePassword({
      password: params.password.trim(),
    });
  } finally {
    try {
      await appwriteAccount.deleteSession("current");
    } catch {
      // Ignore if the session was already cleared.
    }
  }
}

export async function confirmPasswordResetByOtp(params: {
  userId: string;
  otp: string;
  password: string;
}) {
  await appwriteAccount.createSession(params.userId, params.otp.trim());
}

export async function verifyPasswordResetOtp(params: {
  userId: string;
  otp: string;
}) {
  if (!params.userId.trim() || !params.otp.trim()) {
    throw new Error("OTP verification details are missing.");
  }

  await appwriteAccount.createSession(params.userId, params.otp.trim());
}

export async function applyPasswordResetAfterOtpVerification(password: string) {
  try {
    await appwriteAccount.updatePassword({
      password: password.trim(),
    });
  } finally {
    try {
      await appwriteAccount.deleteSession("current");
    } catch {
      // Ignore if the session was already cleared.
    }
  }
}

export async function loginMainAdminWithAppwrite(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (normalizedEmail !== mainAdminEmail) {
    throw new Error("Only the main admin can login through Appwrite auth.");
  }

  try {
    await appwriteAccount.deleteSession("current");
  } catch {
    // Ignore when no session exists yet.
  }

  try {
    await appwriteAccount.createEmailPasswordSession(normalizedEmail, normalizedPassword);
  } catch (loginError) {
    try {
      await appwriteAccount.create(
        ID.unique(),
        normalizedEmail,
        normalizedPassword,
        "System Admin",
      );
    } catch (createError) {
      if (isAccountAlreadyExistsError(createError)) {
        throw new Error(
          "Admin account exists, but password is incorrect. Use Forgot password to reset it.",
        );
      }

      throw createError;
    }

    await appwriteAccount.createEmailPasswordSession(normalizedEmail, normalizedPassword);
  }

  const account = await appwriteAccount.get();

  return {
    email: account.email,
    name: account.name?.trim() || "System Admin",
  };
}

export async function signOutMainAdminFromAppwrite() {
  try {
    await appwriteAccount.deleteSession("current");
  } catch {
    // Ignore if there is no active Appwrite session.
  }
}
