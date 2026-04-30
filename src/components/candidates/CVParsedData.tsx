import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, GraduationCap, Award, Languages } from "lucide-react";
import { useTranslations } from "next-intl";

interface CVParsedDataProps {
  data: any;
}

export function CVParsedData({ data }: CVParsedDataProps) {
  const commonT = useTranslations("common");
  if (!data) return null;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Experiencia laboral
        </h3>
        <div className="space-y-6 pl-4 border-l-2 border-muted">
          {data.experience?.map((exp: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base">{exp.position}</h4>
                  <span className="text-sm text-muted-foreground font-medium">
                    {exp.duration?.start} - {exp.duration?.end || "Actualidad"}
                  </span>
                </div>
                <p className="text-primary font-medium text-sm">{exp.company}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {exp.description}
                </p>
                {exp.technologies_used?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {exp.technologies_used.map((tech: string) => (
                      <Badge key={tech} variant="outline" className="text-[10px]">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Formación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.education?.map((edu: any, i: number) => (
            <div key={i} className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-bold text-sm">{edu.degree}</h4>
              <p className="text-sm text-primary">{edu.institution}</p>
              {edu.graduation_year && (
                <p className="text-xs text-muted-foreground mt-1">
                  {commonT("date")}: {edu.graduation_year}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Certificaciones
          </h3>
          <div className="space-y-3">
            {data.certifications?.map((cert: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-md bg-muted/20 border border-dashed"
              >
                <Award className="mt-1 h-4 w-4 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold">{cert.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {cert.issuer} - {cert.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Idiomas
          </h3>
          <div className="flex flex-wrap gap-3">
            {data.languages?.map((lang: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10"
              >
                <span className="text-sm font-bold">{lang.language}</span>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {lang.proficiency}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
