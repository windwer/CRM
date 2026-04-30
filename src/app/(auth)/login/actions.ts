"use server";

import { signIn } from "../../../../auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function credentialsLogin(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          redirect("/login?error=credentials");
        default:
          redirect("/login?error=unknown");
      }
    }

    throw error;
  }
}
