import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const commonT = await getTranslations("common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-black">{t("notFound")}</h1>
      <p className="max-w-md text-muted-foreground">{t("notFoundDescription")}</p>
      <Button asChild>
        <Link href="/dashboard">{commonT("back")}</Link>
      </Button>
    </main>
  );
}
