import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface SearchSkillTagProps {
  skill: string;
  onRemove: (skill: string) => void;
}

export function SearchSkillTag({ skill, onRemove }: SearchSkillTagProps) {
  return (
    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 group">
      {skill}
      <button
        type="button"
        onClick={() => onRemove(skill)}
        className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-0.5 hover:bg-background"
      >
        <X size={12} />
      </button>
    </Badge>
  );
}
