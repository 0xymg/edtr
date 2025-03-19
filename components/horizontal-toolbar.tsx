"use client"

import { useState } from "react"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ChevronDown, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HorizontalToolbarProps {
  onColorChange: (color: string) => void
  onBrushSizeChange: (size: number) => void
  onOpacityChange: (opacity: number) => void
  onFontChange?: (font: string) => void
  onTextStyleChange?: (style: string) => void
  onTextAlignChange?: (align: string) => void
  selectedObject: any
}

export function HorizontalToolbar({
  onColorChange,
  onBrushSizeChange,
  onOpacityChange,
  onFontChange,
  onTextStyleChange,
  onTextAlignChange,
  selectedObject,
}: HorizontalToolbarProps) {
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [opacity, setOpacity] = useState(100)

  const fonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana", "Comic Sans MS"]

  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#800000",
    "#008080",
    "#000080",
    "#808080",
  ]

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    onColorChange(newColor)
  }

  const handleBrushSizeChange = (value: number[]) => {
    const newSize = value[0]
    setBrushSize(newSize)
    onBrushSizeChange(newSize)
  }

  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0]
    setOpacity(newOpacity)
    onOpacityChange(newOpacity / 100)
  }

  const isTextObject = selectedObject?.type === "i-text" || selectedObject?.type === "text"

  return (
    <TooltipProvider>
      <div className="h-12 border-b bg-background flex items-center px-4 gap-4 overflow-x-auto">
        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Color:</span>
          <div className="flex gap-1">
            {colors.slice(0, 7).map((c) => (
              <Tooltip key={c} delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    className="w-6 h-6 rounded-sm border border-border flex-shrink-0"
                    style={{ backgroundColor: c }}
                    onClick={() => handleColorChange(c)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{c}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-6 w-6">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 grid grid-cols-5 gap-1 p-2">
                {colors.map((c) => (
                  <DropdownMenuItem key={c} asChild className="p-0 h-6 cursor-pointer">
                    <button
                      className="w-full h-full rounded-sm border border-border"
                      style={{ backgroundColor: c }}
                      onClick={() => handleColorChange(c)}
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Brush Size */}
        <div className="flex items-center gap-2 min-w-[150px]">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleBrushSizeChange([Math.max(1, brushSize - 1)])}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Decrease size</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex-1">
            <Slider value={[brushSize]} min={1} max={50} step={1} onValueChange={handleBrushSizeChange} />
          </div>

          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleBrushSizeChange([Math.min(50, brushSize + 1)])}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Increase size</p>
            </TooltipContent>
          </Tooltip>

          <span className="text-xs w-6 text-center">{brushSize}</span>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Opacity */}
        <div className="flex items-center gap-2 min-w-[150px]">
          <span className="text-xs font-medium">Opacity:</span>
          <div className="flex-1">
            <Slider value={[opacity]} min={0} max={100} step={1} onValueChange={handleOpacityChange} />
          </div>
          <span className="text-xs w-6 text-center">{opacity}%</span>
        </div>

        {/* Text formatting options - only show when text is selected */}
        {isTextObject && (
          <>
            <div className="h-8 w-px bg-border" />

            {/* Font Family */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Font:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    {selectedObject?.fontFamily || "Arial"}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {fonts.map((font) => (
                    <DropdownMenuItem key={font} onClick={() => onFontChange?.(font)} style={{ fontFamily: font }}>
                      {font}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Text Style */}
            <div className="flex items-center gap-1">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTextStyleChange?.("bold")}>
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bold</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTextStyleChange?.("italic")}>
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Italic</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onTextStyleChange?.("underline")}
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Underline</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-1">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTextAlignChange?.("left")}>
                    <AlignLeft className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Left</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTextAlignChange?.("center")}>
                    <AlignCenter className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Center</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTextAlignChange?.("right")}>
                    <AlignRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Right</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

