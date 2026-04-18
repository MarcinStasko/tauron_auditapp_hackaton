import { useState, useCallback, lazy, Suspense } from 'react';
import Header, { type AppTab } from '@/components/layout/Header';
import PhotoUploader from '@/components/scanner/PhotoUploader';
import ResultsDashboard from '@/components/dashboard/ResultsDashboard';
import ScanHistory from '@/components/dashboard/ScanHistory';
import HouseAuditor from '@/components/heatpump/HouseAuditor';
import type { EnergyData } from '@/lib/types';
import { addToHistory, getHistory } from '@/lib/scan-history';
import { Zap, Loader2 } from 'lucide-react';

const GridMapComponent = lazy(() => import('@/components/map/GridMapComponent'));

const Index = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('scanner');
  const [result, setResult] = useState<EnergyData | null>(null);
  const [history, setHistory] = useState(() => getHistory());

  const handleResult = useCallback((data: EnergyData) => {
    addToHistory(data);
    setHistory(getHistory());
    setResult(data);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
  }, []);

  const handleSelectFromHistory = useCallback((data: EnergyData) => {
    setResult(data);
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container px-4 py-8 space-y-8">
        {activeTab === 'scanner' && (
          <>
            {!result ? (
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold font-display text-foreground">
                    Ile kosztuje Twoje urządzenie?
                  </h1>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Zeskanuj etykietę energetyczną EU i poznaj rzeczywisty roczny koszt prądu w taryfach Tauron.
                  </p>
                </div>
                <PhotoUploader onResult={handleResult} />
                <ScanHistory history={history} onSelect={handleSelectFromHistory} onHistoryChange={refreshHistory} />
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                  <Zap className="h-3.5 w-3.5 text-tauron" />
                  <span>Napędzane sztuczną inteligencją</span>
                </div>
              </div>
            ) : (
              <ResultsDashboard data={result} onReset={handleReset} />
            )}
          </>
        )}

        {activeTab === 'grid' && (
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-tauron animate-spin" />
            </div>
          }>
            <GridMapComponent />
          </Suspense>
        )}

        {activeTab === 'heatpump' && (
          <HouseAuditor />
        )}
      </main>
    </div>
  );
};

export default Index;
