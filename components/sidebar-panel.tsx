"use client"

import { useState } from "react"
import { Layers, Settings, History, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SidebarPanelProps {
  canvas: any
  selectedObject: any
  history: string[]
  historyIndex: number
  onHistoryChange: (index: number) => void
}

export function SidebarPanel({ canvas, selectedObject, history, historyIndex, onHistoryChange }: SidebarPanelProps) {
  const [activeTab, setActiveTab] = useState("layers")

  return (
    <div className="w-full border-l bg-background h-full flex flex-col">
      <Tabs defaultValue="layers" className="flex flex-col h-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 h-12 rounded-none border-b">
          <TabsTrigger
            value="layers"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Layers className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger
            value="properties"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Palette className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <History className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="flex-1 p-4 overflow-auto">
          <h3 className="font-medium mb-2">Layers</h3>
          {canvas && (
            <div className="space-y-1">
              {canvas.getObjects().length === 0 ? (
                <p className="text-sm text-muted-foreground">No layers yet</p>
              ) : (
                canvas.getObjects().map((obj: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 text-sm rounded flex items-center gap-2 cursor-pointer",
                      selectedObject === obj ? "bg-accent" : "hover:bg-muted",
                    )}
                    onClick={() => canvas.setActiveObject(obj)}
                  >
                    <div className="w-4 h-4 bg-primary/20 border border-primary/30 rounded-sm" />
                    <span>
                      {obj.type || "Object"} {index + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="properties" className="flex-1 p-4 overflow-auto">
          <h3 className="font-medium mb-2">Properties</h3>
          {selectedObject ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs block mb-1">Type</label>
                <div className="text-sm">{selectedObject.type}</div>
              </div>

              {selectedObject.fill && (
                <div>
                  <label className="text-xs block mb-1">Fill Color</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-sm border border-border"
                      style={{ backgroundColor: selectedObject.fill }}
                    />
                    <span className="text-sm">{selectedObject.fill}</span>
                  </div>
                </div>
              )}

              {selectedObject.stroke && (
                <div>
                  <label className="text-xs block mb-1">Stroke Color</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-sm border border-border"
                      style={{ backgroundColor: selectedObject.stroke }}
                    />
                    <span className="text-sm">{selectedObject.stroke}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs block mb-1">Width</label>
                  <div className="text-sm">{Math.round(selectedObject.width || 0)}</div>
                </div>
                <div>
                  <label className="text-xs block mb-1">Height</label>
                  <div className="text-sm">{Math.round(selectedObject.height || 0)}</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No object selected</p>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-4 overflow-auto">
          <h3 className="font-medium mb-2">History</h3>
          <div className="space-y-1">
            {history.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "p-2 text-sm rounded flex items-center gap-2 cursor-pointer",
                  historyIndex === index ? "bg-accent" : "hover:bg-muted",
                )}
                onClick={() => onHistoryChange(index)}
              >
                <span>State {index + 1}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4 overflow-auto">
          <h3 className="font-medium mb-2">Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1">Canvas Background</label>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm border border-border"
                  style={{ backgroundColor: canvas?.backgroundColor || "#f5f5f5" }}
                />
                <span className="text-sm">{canvas?.backgroundColor || "#f5f5f5"}</span>
              </div>
            </div>

            <div>
              <label className="text-xs block mb-1">Canvas Size</label>
              <div className="text-sm">{canvas ? `${canvas.width} × ${canvas.height}` : "Loading..."}</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

