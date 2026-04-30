import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";

interface EmailTemplateSelectorProps {
  templates: any[];
  onSelect: (template: any) => void;
}

export function EmailTemplateSelector({ templates, onSelect }: EmailTemplateSelectorProps) {
  const t = useTranslations("email");
  return (
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <Select onValueChange={(id) => {
        if (id === "none") {
          onSelect(null);
        } else {
          const template = templates.find(t => t.id === id);
          onSelect(template);
        }
      }}>
        <SelectTrigger className="w-[200px] h-8 text-xs bg-muted/50 border-none shadow-none focus:ring-0">
          <SelectValue placeholder={t("selectTemplate")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("template")}</SelectItem>
          {templates?.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
