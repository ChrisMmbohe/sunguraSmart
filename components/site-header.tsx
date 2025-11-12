/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"
import React, { useState } from "react"
import Link from "next/link"
import { ModeToggle } from "./ui/modetoggle"
import { usePathname } from "next/navigation"



export function SiteHeader() {
   const pathname = usePathname();
  
    // Split the path into segments and create breadcrumb items
    const pathSegments = pathname.split("/").filter((segment) => segment !== "");
  
    // Format segment for display
    const formatSegment = (segment: string) => {
      return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };
  
    // Generate path for each segment
    const getPathToSegment = (index: number) => {
      return "/" + pathSegments.slice(0, index + 1).join("/");
    };
  
    const [activeInput, setActiveInput] = useState("");
  
    //const [activeTab, setActiveTab] = useState("tab1"); // State to manage active tab
    const handleFocus = (inputId: string) => {
      setActiveInput(inputId);
    };
    const handleBlur = () => {
      setActiveInput("");
    };
  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block"></BreadcrumbItem>
                {pathSegments.map((segment, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {index === pathSegments.length - 1 ? (
                        <BreadcrumbPage>
                          {formatSegment(segment)}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={getPathToSegment(index)}>
                            {formatSegment(segment)}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center px-4 gap-2">
            <ModeToggle />
          </div>
        </header>
  )
}
