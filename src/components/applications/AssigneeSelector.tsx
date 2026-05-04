"use client";

import React from "react";
import axios from "axios";
import { UserPlus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface AssigneeSelectorProps {
  applicationId: string;
  assignedTo?: any;
}

export function AssigneeSelector({ applicationId, assignedTo }: AssigneeSelectorProps) {
  const { data: users = [] } = useUsers();
  const queryClient = useQueryClient();
  const t = useTranslations("applications");

  const updateAssignee = async (assignedToId: string | null) => {
    try {
      await axios.patch(`/api/applications/${applicationId}/assign`, { assignedToId });
      await queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Responsable actualizado" });
    } catch (error: any) {
      toast({
        title: "No se pudo actualizar el responsable",
        description: error.response?.data?.error?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3">
          {assignedTo ? (
            <>
              <Avatar className="h-7 w-7">
                <AvatarImage src={assignedTo.avatarUrl || undefined} />
                <AvatarFallback>{assignedTo.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate">{assignedTo.name}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              {t("unassigned")}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem onClick={() => updateAssignee(null)} className="gap-2">
          <X className="h-4 w-4" />
          {t("removeAssignment")}
        </DropdownMenuItem>
        {users.map((user: any) => (
          <DropdownMenuItem key={user.id} onClick={() => updateAssignee(user.id)} className="gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
