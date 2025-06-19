import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PDFMarginType, PDFMarginSettings } from '@/hooks/use-document';

interface SettingsDialogProps {
  pdfMargins: PDFMarginType;
  setPdfMargins: (margin: PDFMarginType) => void;
  pdfMarginPresets: Record<PDFMarginType, PDFMarginSettings>;
}

export function SettingsDialog({ pdfMargins, setPdfMargins, pdfMarginPresets }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your document export preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pdf-margins" className="text-right">
              PDF Margins
            </Label>
            <Select
              value={pdfMargins}
              onValueChange={(value: PDFMarginType) => setPdfMargins(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select margin size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="narrower">Narrower ({pdfMarginPresets.narrower.top}mm)</SelectItem>
                <SelectItem value="narrow">Narrow ({pdfMarginPresets.narrow.top}mm)</SelectItem>
                <SelectItem value="normal">Normal ({pdfMarginPresets.normal.top}mm)</SelectItem>
                <SelectItem value="wide">Wide ({pdfMarginPresets.wide.top}mm)</SelectItem>
                <SelectItem value="wider">Wider ({pdfMarginPresets.wider.top}mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            <strong>Current setting:</strong> {pdfMargins} margins ({pdfMarginPresets[pdfMargins].top}mm)
            <br />
            This will be used as the default for PDF exports.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}