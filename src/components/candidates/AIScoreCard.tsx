import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { useTranslations } from "next-intl";

type AIScoreDetails = {
  matched_skills?: string[];
  missing_skills?: string[];
  strengths?: string[];
  gaps?: string[];
  recommendation?: string;
  score_breakdown?: Record<string, number | undefined>;
};

interface AIScoreCardProps {
  applicationId: string;
  candidateId: string;
  offerId: string;
  score?: number;
  explanation?: string;
  aiScoreDetails?: AIScoreDetails | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  gaps?: string[];
}

export function AIScoreCard({
  applicationId,
  candidateId,
  offerId,
  score,
  explanation,
  aiScoreDetails,
  matchedSkills = [],
  missingSkills = [],
  strengths = [],
  gaps = [],
}: AIScoreCardProps) {
  const { scoreCandidate, isScoring } = useAI();
  const t = useTranslations("candidates.aiScore");
  const resolvedMatchedSkills = aiScoreDetails?.matched_skills ?? matchedSkills;
  const resolvedMissingSkills = aiScoreDetails?.missing_skills ?? missingSkills;
  const resolvedStrengths = aiScoreDetails?.strengths ?? strengths;
  const resolvedGaps = aiScoreDetails?.gaps ?? gaps;

  const getScoreColor = (s: number) => {
    if (s >= 0.8) return "text-emerald-500 border-emerald-500 bg-emerald-50";
    if (s >= 0.6) return "text-amber-500 border-amber-500 bg-amber-50";
    return "text-rose-500 border-rose-500 bg-rose-50";
  };

  const handleScore = async () => {
    await scoreCandidate({ candidateId, offerId, applicationId });
  };

  if (score === undefined || score === null) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("title")}</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {t("noScore")}
            </p>
          </div>
          <Button onClick={handleScore} disabled={isScoring}>
            {isScoring ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            {t("rescore")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {t("title")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleScore} disabled={isScoring}>
            <RefreshCw className={`h-3 w-3 ${isScoring ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-6">
          <div
            className={`
              text-4xl font-black h-20 w-20 rounded-2xl flex items-center justify-center border-4
              ${getScoreColor(score)}
            `}
          >
            {Math.round(score * 100)}%
          </div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-foreground/80 italic font-medium">
              "{explanation}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {t("strengths")}
            </h4>
            <ul className="space-y-2">
              {resolvedStrengths.length > 0 ? (
                resolvedStrengths.map((strength, index) => (
                  <li key={index} className="text-xs flex gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {strength}
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">{t("noScore")}</li>
              )}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {t("gaps")}
            </h4>
            <ul className="space-y-2">
              {resolvedGaps.length > 0 ? (
                resolvedGaps.map((gap, index) => (
                  <li key={index} className="text-xs flex gap-2 text-muted-foreground">
                    <span className="text-rose-500 mt-0.5">✗</span>
                    {gap}
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">{t("noScore")}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("matched")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {resolvedMatchedSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border-emerald-100"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {skill}
              </Badge>
            ))}
            {resolvedMissingSkills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="border-rose-200 bg-rose-50 text-rose-700"
              >
                <XCircle className="mr-1 h-3 w-3" />
                {skill}
              </Badge>
            ))}
            {resolvedMatchedSkills.length === 0 && resolvedMissingSkills.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {t("noScore")}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
