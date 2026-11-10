"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { BreedingTableData } from "@/app/breeding/types";

export function RowActions({ row, onEdit, onDelete }: { row: BreedingTableData; onEdit: () => void; onDelete: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Open actions</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-3.5 w-3.5" />Edit details</DropdownMenuItem><DropdownMenuItem onClick={onDelete} disabled={Boolean(row.litterId)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}