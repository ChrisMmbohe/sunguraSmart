"use client";

import * as React from "react";

interface NavWorkspacesProps {
  workspaces: Array<{ name: string; emoji?: string; pages?: Array<{ name: string; url: string; emoji?: string }> }>;
}

export function NavWorkspaces({ workspaces }: NavWorkspacesProps) {
  return null;
}
