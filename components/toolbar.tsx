"use client"

import type React from "react"

import { useRef } from "react"
import { Circle, Download, FileUp, MousePointer, Pencil, Redo2, Square, Trash2, Type, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  activeMode: string
  onToolSelect: (mode: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDownloadImage: () => void
}

export function Toolbar({
  activeMode,
  onToolSelect,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onUploadImage,
  onDownloadImage,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tools = [
    { id: "select", icon: MousePointer, tooltip: "Select" },
    { id: "draw", icon: Pencil, tooltip: "Draw" },
    { id: "rectangle", icon: Square, tooltip: "Rectangle" },
    { id: "circle", icon: Circle, tooltip: "Circle" },
    { id: "text", icon: Type, tooltip: "Text" },
  ]

  const actions = [
    { id: "upload", icon: FileUp, tooltip: "Upload Image", action: () => fileInputRef.current?.click() },
    { id: "download", icon: Download, tooltip: "Download Image", action: onDownloadImage },
    { id: "clear", icon: Trash2, tooltip: "Clear Canvas" },
  ]

  return (
    <TooltipProvider>
      <div className="w-10 h-full bg-background border-r flex flex-col items-center py-4 gap-3">
        <div className="flex flex-col gap-1.5">
          {tools.map((tool) => (
            <Tooltip key={tool.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeMode === tool.id ? "default" : "ghost"}
                  size="icon"
                  className={cn("h-8 w-8", activeMode === tool.id && "bg-primary text-primary-foreground")}
                  onClick={() => onToolSelect(tool.id)}
                >
                  <tool.icon className="h-4 w-4" />
                  <span className="sr-only">{tool.tooltip}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="h-px w-8 bg-border my-1.5" />

        <div className="flex flex-col gap-1.5">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4" />
                <span className="sr-only">Undo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo}>
                <Redo2 className="h-4 w-4" />
                <span className="sr-only">Redo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="h-px w-8 bg-border my-1.5" />

        <div className="flex flex-col gap-1.5">
          {actions.map((action) => (
            <Tooltip key={action.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeMode === action.id ? "default" : "ghost"}
                  size="icon"
                  className={cn("h-8 w-8", activeMode === action.id && "bg-primary text-primary-foreground")}
                  onClick={action.action || (() => onToolSelect(action.id))}
                >
                  <action.icon className="h-4 w-4" />
                  <span className="sr-only">{action.tooltip}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{action.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onUploadImage} />
      </div>
    </TooltipProvider>
  )
}

