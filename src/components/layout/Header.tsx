import { Zap, Moon, Sun, ScanLine, Map, Home } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';

export type AppTab = 'scanner' | 'grid' | 'heatpump';

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: 'scanner', label: 'Kalkulator AGD', icon: <ScanLine className="h-4 w-4" /> },
  { id: 'grid', label: 'Mapa Sieci', icon: <Map className="h-4 w-4" /> },
  { id: 'heatpump', label: 'Audyt Domu', icon: <Home className="h-4 w-4" /> },
];

const Header = ({ activeTab, onTabChange }: Props) => {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-tauron p-1.5 rounded-lg">
            <Zap className="h-5 w-5 text-tauron-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">
            Tauron <span className="text-tauron">Energy Scout</span>
          </span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
};

export default Header;
