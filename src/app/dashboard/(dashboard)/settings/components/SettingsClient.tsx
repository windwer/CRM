"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  CheckCircle2,
  Cloud,
  Mail,
  PlugZap,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
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
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

type Role = "admin" | "recruiter" | "manager" | "viewer";

type SettingsUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
};

type OutlookStatus = {
  connected: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  sync_status: string;
};

type TestResult = {
  configured: boolean;
  ok: boolean;
  error?: string;
};

const roles: Role[] = ["admin", "manager", "recruiter", "viewer"];

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function IntegrationStateBadge({
  configured,
  ok,
  configuredLabel,
  notConfiguredLabel,
  errorLabel,
}: {
  configured: boolean;
  ok?: boolean;
  configuredLabel: string;
  notConfiguredLabel: string;
  errorLabel: string;
}) {
  if (!configured) {
    return <Badge variant="secondary">{notConfiguredLabel}</Badge>;
  }

  if (ok === false) {
    return <Badge variant="destructive">{errorLabel}</Badge>;
  }

  return <Badge className="bg-emerald-100 text-emerald-700">{configuredLabel}</Badge>;
}

export function SettingsClient() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations("settings");
  const commonT = useTranslations("common");
  const emailT = useTranslations("email");
  const toastT = useTranslations("toasts");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
    variables: "",
  });
  const [claudeResult, setClaudeResult] = useState<TestResult | null>(null);
  const [azureResult, setAzureResult] = useState<TestResult | null>(null);

  const currentRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = currentRole === "admin";
  const defaultTab = isAdmin ? "users" : "templates";

  const usersQuery = useQuery({
    queryKey: ["settings-users"],
    queryFn: async () =>
      unwrap<SettingsUser[]>(await axios.get("/api/settings/users")),
    enabled: isAdmin,
  });

  const templatesQuery = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () =>
      unwrap<EmailTemplate[]>(await axios.get("/api/email-templates")),
  });

  const outlookQuery = useQuery({
    queryKey: ["outlook-status"],
    queryFn: async () =>
      unwrap<OutlookStatus>(await axios.get("/api/outlook/status")),
  });

  const inviteUserMutation = useMutation({
    mutationFn: async () =>
      axios.post("/api/settings/users", {
        email: inviteEmail,
        role: inviteRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteOpen(false);
      toast({ title: toastT("userInvited") });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<SettingsUser, "role" | "isActive">>;
    }) => axios.patch(`/api/settings/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      toast({ title: toastT("userUpdated") });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: templateForm.name,
        subject: templateForm.subject,
        body: templateForm.body,
        variables: templateForm.variables
          .split(",")
          .map((variable) => variable.trim())
          .filter(Boolean),
      };

      if (editingTemplateId) {
        return axios.put(`/api/email-templates/${editingTemplateId}`, payload);
      }

      return axios.post("/api/email-templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      clearTemplateForm();
      toast({ title: t("templates.saved") });
    },
  });

  const deactivateTemplateMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/email-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: t("templates.deactivated") });
    },
  });

  const syncOutlookMutation = useMutation({
    mutationFn: async () => axios.post("/api/outlook/sync"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlook-status"] });
      toast({ title: t("integrations.outlook.synced") });
    },
  });

  const disconnectOutlookMutation = useMutation({
    mutationFn: async () => axios.delete("/api/outlook/status"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlook-status"] });
      toast({ title: t("integrations.outlook.disconnectedToast") });
    },
  });

  const testClaudeMutation = useMutation({
    mutationFn: async () =>
      unwrap<TestResult>(await axios.get("/api/settings/test-claude")),
    onSuccess: setClaudeResult,
  });

  const testAzureMutation = useMutation({
    mutationFn: async () =>
      unwrap<TestResult>(await axios.get("/api/settings/test-azure")),
    onSuccess: setAzureResult,
  });

  const outlookStatus = outlookQuery.data;
  const lastSyncLabel = useMemo(() => {
    if (!outlookStatus?.last_sync_at) return commonT("never");

    return formatDistanceToNow(new Date(outlookStatus.last_sync_at), {
      locale: es,
      addSuffix: true,
    });
  }, [outlookStatus?.last_sync_at, commonT]);

  function clearTemplateForm() {
    setEditingTemplateId(null);
    setTemplateForm({ name: "", subject: "", body: "", variables: "" });
  }

  function editTemplate(template: EmailTemplate) {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables.join(", "),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          {isAdmin && <TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>}
          <TabsTrigger value="templates">{t("tabs.templates")}</TabsTrigger>
          <TabsTrigger value="integrations">{t("tabs.integrations")}</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("users.title")}</CardTitle>
                  <CardDescription>
                    {t("users.description")}
                  </CardDescription>
                </div>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("users.invite")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("users.invite")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">{commonT("email")}</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(event) => setInviteEmail(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("users.inviteRole")}</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={(value: Role) => setInviteRole(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {t(`users.roles.${role}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        disabled={!inviteEmail || inviteUserMutation.isPending}
                        onClick={() => inviteUserMutation.mutate()}
                      >
                        {t("users.sendInvite")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {usersQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : usersQuery.data?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{commonT("name")}</TableHead>
                        <TableHead>{commonT("email")}</TableHead>
                        <TableHead>{t("users.inviteRole")}</TableHead>
                        <TableHead>{commonT("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersQuery.data.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name || commonT("unnamed")}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(role: Role) =>
                                updateUserMutation.mutate({
                                  id: user.id,
                                  data: { role },
                                })
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {t(`users.roles.${role}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={user.isActive ? "outline" : "secondary"}
                              size="sm"
                              onClick={() =>
                                updateUserMutation.mutate({
                                  id: user.id,
                                  data: { isActive: !user.isActive },
                                })
                              }
                            >
                              {user.isActive ? t("users.active") : t("users.inactive")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-md border p-6 text-sm text-muted-foreground">
                    {t("users.empty")}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="templates">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>{emailT("templates.title")}</CardTitle>
                <CardDescription>
                  {t("templates.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : templatesQuery.data?.length ? (
                  <div className="space-y-3">
                    {templatesQuery.data.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-md border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="truncate text-sm text-muted-foreground">
                              {template.subject}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editTemplate(template)}
                            >
                              {commonT("edit")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                deactivateTemplateMutation.mutate(template.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {template.variables.length ? (
                            template.variables.map((variable) => (
                              <Badge key={variable} variant="secondary">
                                {variable}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t("templates.noVariables")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border p-6 text-sm text-muted-foreground">
                    {t("templates.empty")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {editingTemplateId ? t("templates.edit") : t("templates.create")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">{commonT("name")}</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(event) =>
                      setTemplateForm((form) => ({
                        ...form,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-subject">{emailT("subject")}</Label>
                  <Input
                    id="template-subject"
                    value={templateForm.subject}
                    onChange={(event) =>
                      setTemplateForm((form) => ({
                        ...form,
                        subject: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-body">{emailT("body")}</Label>
                  <Textarea
                    id="template-body"
                    rows={8}
                    value={templateForm.body}
                    onChange={(event) =>
                      setTemplateForm((form) => ({
                        ...form,
                        body: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-variables">{emailT("templates.variables")}</Label>
                  <Input
                    id="template-variables"
                    placeholder={t("templates.variablesPlaceholder")}
                    value={templateForm.variables}
                    onChange={(event) =>
                      setTemplateForm((form) => ({
                        ...form,
                        variables: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={
                      !templateForm.name ||
                      !templateForm.subject ||
                      !templateForm.body ||
                      saveTemplateMutation.isPending
                    }
                    onClick={() => saveTemplateMutation.mutate()}
                  >
                    {commonT("save")}
                  </Button>
                  {editingTemplateId && (
                    <Button variant="outline" onClick={clearTemplateForm}>
                      {commonT("cancel")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Mail className="h-5 w-5" />
                  {t("integrations.outlook.title")}
                </CardTitle>
                <CardDescription>{lastSyncLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {outlookQuery.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        outlookStatus?.connected
                          ? "bg-emerald-100 text-emerald-700"
                          : ""
                      }
                      variant={outlookStatus?.connected ? "default" : "secondary"}
                    >
                      {outlookStatus?.connected ? t("integrations.outlook.connected") : t("integrations.outlook.disconnected")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {outlookStatus?.sync_status || "pending"}
                    </span>
                  </div>
                )}
                {outlookStatus?.last_error && (
                  <p className="text-sm text-destructive">
                    {outlookStatus.last_error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {outlookStatus?.connected ? (
                    <Button
                      variant="outline"
                      onClick={() => disconnectOutlookMutation.mutate()}
                    >
                      {t("integrations.outlook.disconnect")}
                    </Button>
                  ) : (
                    <Button asChild>
                      <a href="/api/auth/signin/microsoft-entra-id">
                        {t("integrations.outlook.connect")}
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={
                      !outlookStatus?.connected || syncOutlookMutation.isPending
                    }
                    onClick={() => syncOutlookMutation.mutate()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("integrations.outlook.syncNow")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <PlugZap className="h-5 w-5" />
                  {t("integrations.claude.title")}
                </CardTitle>
                <CardDescription>{t("integrations.claude.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <IntegrationStateBadge
                    configured={claudeResult?.configured ?? true}
                    ok={claudeResult?.ok}
                    configuredLabel={t("integrations.claude.configured")}
                    notConfiguredLabel={t("integrations.claude.notConfigured")}
                    errorLabel={commonT("error")}
                  />
                  {claudeResult?.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : claudeResult?.error ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Activity className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                {claudeResult?.error && (
                  <p className="text-sm text-destructive">
                    {claudeResult.error}
                  </p>
                )}
                <Button
                  variant="outline"
                  disabled={testClaudeMutation.isPending}
                  onClick={() => testClaudeMutation.mutate()}
                >
                  {t("integrations.claude.testConnection")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Cloud className="h-5 w-5" />
                  {t("integrations.azure.title")}
                </CardTitle>
                <CardDescription>{t("integrations.azure.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <IntegrationStateBadge
                    configured={azureResult?.configured ?? true}
                    ok={azureResult?.ok}
                    configuredLabel={t("integrations.azure.configured")}
                    notConfiguredLabel={t("integrations.azure.notConfigured")}
                    errorLabel={commonT("error")}
                  />
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                {azureResult?.error && (
                  <p className="text-sm text-destructive">
                    {azureResult.error}
                  </p>
                )}
                <Button
                  variant="outline"
                  disabled={testAzureMutation.isPending}
                  onClick={() => testAzureMutation.mutate()}
                >
                  {t("integrations.azure.testConnection")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
