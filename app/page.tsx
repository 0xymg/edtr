"use client"

import { ImageEditor } from "@/components/image-editor"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full h-screen">
        <ImageEditor />
      </div>
    </main>
  )
}

