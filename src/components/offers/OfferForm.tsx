"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { offerSchema } from "@/lib/validations/offer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface OfferFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function OfferForm({ initialData, onSubmit, isLoading }: OfferFormProps) {
  const t = useTranslations("offers.form");
  const offerT = useTranslations("offers");
  const commonT = useTranslations("common");
  const { data: session } = useSession();

  const { data: usersData } = useQuery<{ id: string; name: string; email: string }[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axios.get("/api/users");
      return data.data;
    },
  });

  const form = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      location: "",
      salaryMax: 0,
      status: "draft",
      jobType: "full_time",
      company: "",
      positionType: "developer",
      isUrgent: false,
      customTags: [],
      mustHaves: "",
      assignedToUserId: (session?.user as any)?.id ?? "",
    },
  });
  React.useEffect(() => {
    if (!initialData && (session?.user as any)?.id) {
      const currentVal = form.getValues("assignedToUserId");
      if (!currentVal) {
        form.setValue("assignedToUserId", (session!.user as any).id, { shouldValidate: false });
      }
    }
  }, [session, initialData, form]);

  const [tagInput, setTagInput] = React.useState("");
  const customTags = form.watch("customTags") || [];
  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || tag.length > 30 || customTags.includes(tag) || customTags.length >= 10) return;
    form.setValue("customTags", [...customTags, tag], { shouldDirty: true, shouldValidate: true });
    setTagInput("");
  };
  const removeTag = (tag: string) => {
    form.setValue("customTags", customTags.filter((item: string) => item !== tag), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-xl border-primary/10">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-xl font-black">{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("title")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("placeholders.title")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedToUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestionada por</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(usersData ?? []).map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6 rounded-2xl border bg-muted/20 p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Clasificacion
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{offerT("company")}</FormLabel>
                      <FormControl>
                        <Input placeholder="SmartCRM" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="positionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{offerT("positionType")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={offerT("positionType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["developer", "designer", "manager", "product", "marketing", "sales", "data", "devops", "qa", "other"].map((type) => (
                            <SelectItem key={type} value={type}>
                              {offerT(`positionTypes.${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isUrgent"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-xl bg-background p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="h-5 w-5 accent-primary"
                      />
                    </FormControl>
                    <FormLabel className="m-0 font-bold">{offerT("markUrgent")}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-2xl border bg-muted/20 p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                {offerT("customTags")}
              </h3>
              <Input
                value={tagInput}
                maxLength={30}
                placeholder={offerT("customTagsPlaceholder")}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {customTags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="gap-1 px-3 py-1">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="mustHaves"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{offerT("mustHaves")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        "Lista los requisitos imprescindibles que debe cumplir el candidato.\nEjemplo:\n- Mas de 3 anos de experiencia con React\n- Ingles nivel B2 o superior\n- Disponibilidad inmediata\n- Residencia en Madrid o alrededores"
                      }
                      className="min-h-[220px] resize-none"
                      maxLength={2000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{offerT("mustHavesHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("location")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("placeholders.location")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("jobType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("jobType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_time">{offerT("jobType.full_time")}</SelectItem>
                        <SelectItem value="part_time">{offerT("jobType.part_time")}</SelectItem>
                        <SelectItem value="contract">{offerT("jobType.contract")}</SelectItem>
                        <SelectItem value="internship">{offerT("jobType.internship")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("placeholders.description")} 
                      className="min-h-[150px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {t("description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salaryMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("salaryMax")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-6 border-t">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 px-8 shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {initialData ? commonT("save") : offerT("newOffer")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
