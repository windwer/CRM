import React, { useState, KeyboardEvent } from "react";
import { useFilterStore } from "@/stores/filterStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchSkillTag } from "./SearchSkillTag";
import { Search, RotateCcw, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export function SearchAdvanced() {
  const { candidateFilters, setCandidateFilters, clearCandidateFilters } = useFilterStore();
  const [skillInput, setSkillInput] = useState("");
  const t = useTranslations("candidates.search");
  const commonT = useTranslations("common");

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !candidateFilters.skills.includes(skill)) {
      setCandidateFilters({
        skills: [...candidateFilters.skills, skill],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setCandidateFilters({
      skills: candidateFilters.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Skills Selector */}
        <div className="space-y-2 lg:col-span-1">
          <Label>{t("skills")}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t("skillsPlaceholder")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
                onClick={addSkill}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {candidateFilters.skills.map((skill) => (
              <SearchSkillTag key={skill} skill={skill} onRemove={removeSkill} />
            ))}
          </div>
        </div>

        {/* Seniority Selector */}
        <div className="space-y-2">
          <Label>{t("seniority")}</Label>
          <Select
            value={candidateFilters.seniority ?? "all"}
            onValueChange={(val) => setCandidateFilters({ seniority: val === "all" ? undefined : val })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("seniorityOptions.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("seniorityOptions.all")}</SelectItem>
              <SelectItem value="junior">{t("seniorityOptions.junior")}</SelectItem>
              <SelectItem value="mid">{t("seniorityOptions.mid")}</SelectItem>
              <SelectItem value="senior">{t("seniorityOptions.senior")}</SelectItem>
              <SelectItem value="lead">{t("seniorityOptions.lead")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Range */}
        <div className="space-y-2">
          <Label>{t("experienceMin")} / {t("experienceMax")}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={t("experienceMin")}
              value={candidateFilters.experienceMin ?? ""}
              onChange={(e) =>
                setCandidateFilters({
                  experienceMin: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder={t("experienceMax")}
              value={candidateFilters.experienceMax ?? ""}
              onChange={(e) =>
                setCandidateFilters({
                  experienceMax: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Talent Pool Status */}
        <div className="space-y-2">
          <Label>Estado en pool</Label>
          <Select
            value={candidateFilters.talentPoolStatus}
            onValueChange={(val) =>
              setCandidateFilters({ talentPoolStatus: val as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exclude_discarded">Activos (excl. descartados)</SelectItem>
              <SelectItem value="active">Solo activos</SelectItem>
              <SelectItem value="may_fit_future">Encajan a futuro</SelectItem>
              <SelectItem value="discarded">Descartados</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Salary Range */}
        <div className="space-y-2 lg:col-span-2">
          <Label>Pretensión salarial (EUR/año)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Mínimo"
              min={0}
              value={candidateFilters.salaryMin ?? ""}
              onChange={(e) =>
                setCandidateFilters({
                  salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Máximo"
              min={0}
              value={candidateFilters.salaryMax ?? ""}
              onChange={(e) =>
                setCandidateFilters({
                  salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={candidateFilters.includeUndefinedSalary}
              onChange={(e) => setCandidateFilters({ includeUndefinedSalary: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
            />
            Incluir candidatos sin salario definido
          </label>
        </div>

        {/* Skills Logic Toggle */}
        <div className="space-y-2">
          <Label>{t("mode.and")}</Label>
          <Select
            value={candidateFilters.skillsMode}
            onValueChange={(val: "AND" | "OR") => setCandidateFilters({ skillsMode: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("mode.and")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">{t("mode.and")}</SelectItem>
              <SelectItem value="OR">{t("mode.or")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t">
        <Button
          variant="ghost"
          onClick={clearCandidateFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {commonT("clear")}
        </Button>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Search className="mr-2 h-4 w-4" />
          {commonT("search")}
        </Button>
      </div>
    </div>
  );
}
