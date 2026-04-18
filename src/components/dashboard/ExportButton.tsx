import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ExportButton = () => (
  <Button
    onClick={() => window.print()}
    variant="outline"
    className="print:hidden w-full gap-2"
  >
    <Download className="h-4 w-4" />
    Pobierz Raport
  </Button>
);

export default ExportButton;
