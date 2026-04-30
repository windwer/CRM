import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, MessageSquare, UserCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface TopOffersProps {
  offers: any[];
}

export function TopOffers({ offers }: TopOffersProps) {
  const t = useTranslations("dashboard.topOffers");

  return (
    <div className="rounded-xl border border-muted/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-muted/50">
            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
              {t("columns.offer")}
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
              {t("columns.candidates")}
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
              {t("columns.inInterview")}
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
              {t("columns.hired")}
            </TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => (
            <TableRow
              key={offer.id}
              className="group hover:bg-muted/20 border-muted/50 transition-colors"
            >
              <TableCell className="py-4">
                <p className="font-bold text-sm group-hover:text-primary transition-colors">
                  {offer.title}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                  {offer.department || "Ingeniería"} - {offer.location || "Remoto"}
                </p>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="secondary"
                  className="font-black bg-primary/5 text-primary"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {offer.total_candidates}
                </Badge>
              </TableCell>
              <TableCell className="text-center text-sm font-bold">
                <div className="flex items-center justify-center gap-1.5 text-amber-600">
                  <MessageSquare className="h-3 w-3" />
                  {offer.in_interview}
                </div>
              </TableCell>
              <TableCell className="text-center text-sm font-bold">
                <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                  <UserCheck className="h-3 w-3" />
                  {offer.hired}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="rounded-full group-hover:bg-primary group-hover:text-white transition-all"
                >
                  <Link href={`/dashboard/offers/${offer.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {offers.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground italic"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
