"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Toolbar } from "./toolbar"
import { Navbar } from "./navbar"
import { SidebarPanel } from "./sidebar-panel"
import { cn } from "@/lib/utils"

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<any>(null)
  const [activeMode, setActiveMode] = useState<string>("select")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [fabricLoaded, setFabricLoaded] = useState(false)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const fabricRef = useRef<any>(null)

  // Load Fabric.js once at component mount
  useEffect(() => {
    const loadFabric = async () => {
      try {
        // Import the entire fabric module
        const fabricModule = await import("fabric")
        // The correct way to access the fabric object
        fabricRef.current = fabricModule.fabric || fabricModule.default
        setFabricLoaded(true)
      } catch (error) {
        console.error("Failed to load Fabric.js:", error)
      }
    }

    loadFabric()
  }, [])

  // Initialize canvas after fabric is loaded
  useEffect(() => {
    if (!fabricLoaded || !canvasRef.current || canvas) return

    const fabric = fabricRef.current
    if (!fabric) return

    try {
      // Create canvas instance - adjust for navbar height (48px) and sidebar width (256px)
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth - 56 - 256, // Left toolbar (56px) + Right sidebar (256px)
        height: window.innerHeight - 48, // Navbar height (48px)
        backgroundColor: "#f5f5f5",
      })

      setCanvas(fabricCanvas)

      // Save initial state
      const initialState = JSON.stringify(fabricCanvas)
      setHistory([initialState])
      setHistoryIndex(0)

      // Track selected object
      fabricCanvas.on("selection:created", (e: any) => {
        setSelectedObject(e.selected[0])
      })

      fabricCanvas.on("selection:updated", (e: any) => {
        setSelectedObject(e.selected[0])
      })

      fabricCanvas.on("selection:cleared", () => {
        setSelectedObject(null)
      })

      // Handle window resize
      const handleResize = () => {
        fabricCanvas.setWidth(window.innerWidth - 56 - 256)
        fabricCanvas.setHeight(window.innerHeight - 48)
        fabricCanvas.renderAll()
      }

      window.addEventListener("resize", handleResize)

      // Cleanup function
      return () => {
        fabricCanvas.dispose()
        window.removeEventListener("resize", handleResize)
      }
    } catch (error) {
      console.error("Error initializing canvas:", error)
    }
  }, [fabricLoaded, canvas])

  // Save state after each modification
  useEffect(() => {
    if (!canvas) return

    const handleModification = () => saveState()

    canvas.on("object:modified", handleModification)
    canvas.on("object:added", handleModification)
    canvas.on("object:removed", handleModification)

    return () => {
      canvas.off("object:modified", handleModification)
      canvas.off("object:added", handleModification)
      canvas.off("object:removed", handleModification)
    }
  }, [canvas])

  const saveState = () => {
    if (!canvas) return

    const newState = JSON.stringify(canvas)

    // If we're not at the end of the history, remove future states
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1))
    }

    setHistory((prev) => [...prev, newState])
    setHistoryIndex((prev) => prev + 1)
  }

  const undo = () => {
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1
      canvas.loadFromJSON(history[newIndex], canvas.renderAll.bind(canvas))
      setHistoryIndex(newIndex)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1 && canvas) {
      const newIndex = historyIndex + 1
      canvas.loadFromJSON(history[newIndex], canvas.renderAll.bind(canvas))
      setHistoryIndex(newIndex)
    }
  }

  const handleToolSelect = (mode: string) => {
    if (!canvas) return

    // Disable drawing mode
    canvas.isDrawingMode = false

    // Enable selection by default
    canvas.selection = true

    // Set active objects selectable
    canvas.forEachObject((obj: any) => {
      obj.selectable = true
    })

    // Handle specific modes
    switch (mode) {
      case "draw":
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush.width = 5
        canvas.freeDrawingBrush.color = "#000000"
        break
      case "rectangle":
        addShape("rect")
        break
      case "circle":
        addShape("circle")
        break
      case "text":
        addText()
        break
      case "clear":
        clearCanvas()
        break
    }

    setActiveMode(mode)
  }

  const addShape = (type: string) => {
    if (!canvas || !fabricRef.current) return

    const fabric = fabricRef.current
    let shape

    if (type === "rect") {
      shape = new fabric.Rect({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        width: 100,
        height: 100,
        fill: "rgba(0,0,0,0.1)",
        stroke: "#000000",
        strokeWidth: 2,
      })
    } else if (type === "circle") {
      shape = new fabric.Circle({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        radius: 50,
        fill: "rgba(0,0,0,0.1)",
        stroke: "#000000",
        strokeWidth: 2,
      })
    }

    if (shape) {
      canvas.add(shape)
      canvas.setActiveObject(shape)
      saveState()
    }
  }

  const addText = () => {
    if (!canvas || !fabricRef.current) return

    const fabric = fabricRef.current
    const text = new fabric.IText("Double click to edit", {
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2 - 20,
      fontFamily: "Arial",
      fontSize: 20,
      fill: "#000000",
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    saveState()
  }

  const clearCanvas = () => {
    if (!canvas) return

    canvas.clear()
    canvas.setBackgroundColor("#f5f5f5", canvas.renderAll.bind(canvas))
    saveState()
  }

  const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !fabricRef.current || !e.target.files || e.target.files.length === 0) return

    const fabric = fabricRef.current
    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      if (!event.target) return

      fabric.Image.fromURL(event.target.result as string, (img: any) => {
        // Scale image to fit canvas while maintaining aspect ratio
        const canvasWidth = canvas.width!
        const canvasHeight = canvas.height!

        if (img.width! > canvasWidth || img.height! > canvasHeight) {
          const scaleFactor = Math.min(canvasWidth / img.width!, canvasHeight / img.height!)

          img.scale(scaleFactor * 0.8)
        }

        // Center the image
        img.set({
          left: (canvasWidth - img.width! * (img.scaleX || 1)) / 2,
          top: (canvasHeight - img.height! * (img.scaleY || 1)) / 2,
        })

        canvas.add(img)
        canvas.renderAll()
        saveState()
      })
    }

    reader.readAsDataURL(file)
  }

  const downloadImage = () => {
    if (!canvas) return

    // Convert canvas to data URL and create download link
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
    })

    const link = document.createElement("a")
    link.download = "canvas-image.png"
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const createNewCanvas = () => {
    if (!canvas) return

    clearCanvas()
    saveState()
  }

  const handleHistoryChange = (index: number) => {
    if (canvas && index >= 0 && index < history.length) {
      canvas.loadFromJSON(history[index], canvas.renderAll.bind(canvas))
      setHistoryIndex(index)
    }
  }

  if (!fabricLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar onSave={downloadImage} onNewCanvas={createNewCanvas} />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          activeMode={activeMode}
          onToolSelect={handleToolSelect}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUploadImage={(e) => uploadImage(e)}
          onDownloadImage={downloadImage}
        />

        <div className={cn("flex-1 overflow-hidden", activeMode === "draw" ? "cursor-crosshair" : "")}>
          <canvas ref={canvasRef} />
        </div>

        <SidebarPanel
          canvas={canvas}
          selectedObject={selectedObject}
          history={history}
          historyIndex={historyIndex}
          onHistoryChange={handleHistoryChange}
        />
      </div>
    </div>
  )
}

