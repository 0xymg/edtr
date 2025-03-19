"use client"

import { Image, PanelRight, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onSave: () => void
  onNewCanvas: () => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Navbar({ onSave, onNewCanvas, isSidebarOpen, onToggleSidebar }: NavbarProps) {
  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Image className="h-5 w-5" />
        <h1 className="font-medium">edtr.</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onNewCanvas}>
          New
        </Button>
        <Button variant="ghost" size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-2"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <PanelRight className={`h-4 w-4 transition-transform duration-200 ${isSidebarOpen ? "" : "rotate-180"}`} />
        </Button>
      </div>
    </div>
  )
}

