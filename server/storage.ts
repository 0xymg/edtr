import { documents, type Document, type InsertDocument } from "@shared/schema";

export interface IStorage {
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  getAllDocuments(): Promise<Document[]>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  private currentId: number;

  constructor() {
    this.documents = new Map();
    this.currentId = 1;
    
    // Add a default document for demo purposes
    this.createDocument({
      title: "Welcome to WordPad Pro",
      content: `<h1>Welcome to WordPad Pro</h1>
<p>This is a modern, distraction-free text editor designed for focused writing. Start typing to begin creating your document, or use the toolbar above to format your text.</p>
<h2>Key Features</h2>
<ul>
<li>Rich text formatting with essential tools</li>
<li>Auto-save functionality to prevent data loss</li>
<li>Dark and light theme support</li>
<li>Responsive design for all screen sizes</li>
<li>Keyboard shortcuts for efficient editing</li>
</ul>
<p>The editor is optimized for readability with proper line spacing and maximum width constraints to ensure comfortable reading and writing experience.</p>`
    });
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const now = new Date();
    const document: Document = {
      id,
      title: insertDocument.title || "Untitled Document",
      content: insertDocument.content || "",
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;

    const updated: Document = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }
}

export const storage = new MemStorage();
