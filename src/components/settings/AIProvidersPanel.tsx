"use client";

import { useMemo, useState } from "react";
import { Bot, BrainCircuit, Eye, EyeOff, Pencil, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AIProviderConfig,
  AIProviderName,
  useActivateAIProvider,
  useAIProviders,
  useSaveAIProvider,
  useTestAIProvider,
} from "@/hooks/useAIProviders";

const providerMeta: Record<
  AIProviderName,
  {
    color: string;
    icon: typeof BrainCircuit;
    defaultModel: string;
    defaultDisplayName: string;
    models: string[];
  }
> = {
  anthropic: {
    color: "#D97706",
    icon: BrainCircuit,
    defaultModel: "claude-sonnet-4-5",
    defaultDisplayName: "Claude Sonnet 4.5",
    models: ["claude-sonnet-4-5", "claude-opus-4-5", "claude-haiku-4-5-20251001"],
  },
  openai: {
    color: "#10B981",
    icon: Bot,
    defaultModel: "gpt-4o",
    defaultDisplayName: "OpenAI GPT-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  },
  gemini: {
    color: "#3B82F6",
    icon: Sparkles,
    defaultModel: "gemini-1.5-pro",
    defaultDisplayName: "Gemini 1.5 Pro",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"],
  },
};

const providerOrder: AIProviderName[] = ["anthropic", "openai", "gemini"];

export function AIProvidersPanel() {
  const t = useTranslations("settings.aiProviders");
  const commonT = useTranslations("common");
  const { toast } = useToast();
  const providersQuery = useAIProviders();
  const saveProvider = useSaveAIProvider();
  const activateProvider = useActivateAIProvider();
  const testProvider = useTestAIProvider();
  const [editingProvider, setEditingProvider] = useState<AIProviderName | null>(null);
  const [visibleKey, setVisibleKey] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    model: "",
    api_key: "",
  });

  const providersByName = useMemo(() => {
    return new Map(
      (providersQuery.data ?? []).map((provider) => [provider.provider, provider])
    );
  }, [providersQuery.data]);

  function openEditor(providerName: AIProviderName) {
    const existing = providersByName.get(providerName);
    const meta = providerMeta[providerName];

    setEditingProvider(providerName);
    setVisibleKey(false);
    setForm({
      display_name: existing?.display_name ?? meta.defaultDisplayName,
      model: existing?.model ?? meta.defaultModel,
      api_key: "",
    });
  }

  async function saveCurrentProvider() {
    if (!editingProvider) return;

    const existing = providersByName.get(editingProvider);
    await saveProvider.mutateAsync({
      id: existing?.id,
      provider: editingProvider,
      model: form.model,
      display_name: form.display_name,
      api_key: form.api_key || undefined,
    });
    toast({ title: t("toast.saved") });
    setEditingProvider(null);
  }

  async function activate(provider: AIProviderConfig) {
    if (
      !window.confirm(
        t("activateConfirm", { provider: provider.display_name })
      )
    ) {
      return;
    }

    await activateProvider.mutateAsync(provider.id);
    toast({ title: t("toast.activated", { provider: provider.display_name }) });
  }

  async function testConnection(provider: AIProviderConfig) {
    try {
      const result = await testProvider.mutateAsync(provider.id);
      toast({ title: t("testSuccess", { ms: result.latency_ms }) });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : commonT("error");
      toast({ title: t("testFailed", { error: message }), variant: "destructive" });
    }
  }

  const currentConfig = editingProvider ? providersByName.get(editingProvider) : null;
  const currentMeta = editingProvider ? providerMeta[editingProvider] : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {providersQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {providerOrder.map((providerName) => {
            const provider = providersByName.get(providerName);
            const meta = providerMeta[providerName];
            const Icon = meta.icon;
            const isActive = Boolean(provider?.is_active);
            const isConfigured = Boolean(provider?.has_api_key);

            return (
              <Card key={providerName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                    {t(`providers.${providerName}`)}
                  </CardTitle>
                  <CardDescription>
                    {provider?.model ?? meta.defaultModel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    {isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {t("active")}
                      </Badge>
                    ) : isConfigured ? (
                      <Badge variant="secondary">{t("configured")}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-200 text-red-600">
                        {t("notConfigured")}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("edit")}
                      onClick={() => openEditor(providerName)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <div className="text-xs uppercase text-muted-foreground">
                      {t("modal.apiKey")}
                    </div>
                    <div className="mt-1 font-mono">
                      {provider?.api_key_masked ?? t("notConfigured")}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {provider && isConfigured && !isActive && (
                      <Button
                        variant="secondary"
                        disabled={activateProvider.isPending}
                        onClick={() => activate(provider)}
                      >
                        {t("activate")}
                      </Button>
                    )}
                    {provider && isConfigured && (
                      <Button
                        variant="outline"
                        disabled={testProvider.isPending}
                        onClick={() => testConnection(provider)}
                      >
                        {t("testConnection")}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => openEditor(providerName)}>
                      {provider ? t("edit") : t("configure")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(editingProvider)} onOpenChange={() => setEditingProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("modal.title")}</DialogTitle>
          </DialogHeader>
          {editingProvider && currentMeta && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("modal.provider")}</Label>
                <Input value={t(`providers.${editingProvider}`)} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-display-name">{t("modal.displayName")}</Label>
                <Input
                  id="ai-display-name"
                  value={form.display_name}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      display_name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("modal.model")}</Label>
                <Select
                  value={form.model}
                  onValueChange={(model) =>
                    setForm((value) => ({ ...value, model }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentMeta.models.map((model, index) => (
                      <SelectItem key={model} value={model}>
                        {model}
                        {index === 0 ? ` (${t("models.recommended")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-api-key">{t("modal.apiKey")}</Label>
                {currentConfig?.api_key_masked && (
                  <p className="text-xs text-muted-foreground">
                    {t("modal.apiKeyExisting", {
                      last4: currentConfig.api_key_masked.slice(-4),
                    })}
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    id="ai-api-key"
                    type={visibleKey ? "text" : "password"}
                    placeholder={t("modal.apiKeyPlaceholder")}
                    value={form.api_key}
                    onChange={(event) =>
                      setForm((value) => ({ ...value, api_key: event.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={visibleKey ? commonT("hide") : commonT("show")}
                    onClick={() => setVisibleKey((value) => !value)}
                  >
                    {visibleKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingProvider(null)}>
                  {t("modal.cancel")}
                </Button>
                <Button
                  disabled={
                    saveProvider.isPending ||
                    !form.display_name ||
                    !form.model ||
                    (!currentConfig && form.api_key.length < 10)
                  }
                  onClick={saveCurrentProvider}
                >
                  {t("modal.save")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
