import { Suspense, useMemo, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, CanvasTexture } from 'three';
import { Camera, RotateCcw, X, Info } from 'lucide-react';
import type { DetailedHouseAnalysis } from './HouseAuditor';

export interface LabeledPhoto {
  label: string;
  preview: string;
}

type EnvelopeKey = 'walls' | 'roof' | 'windows' | 'floor';

interface HotspotInfo {
  key: EnvelopeKey;
  faceName: string;
  uValue: number;
  lossKw: number;
  lossPercent: number;
  quality: string;
  suggestion: string;
  upgradeCost: number;
  upgradeUValue: number;
}

interface Props {
  analysis: DetailedHouseAnalysis;
  labeledPhotos: LabeledPhoto[];
}

/* --- Placeholder texture (gray with camera icon) --- */
function makePlaceholderTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // gray gradient bg
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#3a3a3a');
  grad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  // diagonal stripes for "missing" feel
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 2;
  for (let i = -512; i < 512; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();
  }
  // camera icon (simple — use plain rect, not roundRect, for browser compat)
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(186, 200, 140, 100);
  ctx.beginPath();
  ctx.arc(256, 250, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2a2a';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(256, 250, 20, 0, Math.PI * 2);
  ctx.fill();
  // label
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Brak zdjęcia', 256, 360);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(text, 256, 392);

  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* --- Helper: load a texture from a URL (only when defined) --- */
function PhotoTexturedMaterial({
  photoUrl,
  fallbackLabel,
  highlighted,
}: { photoUrl: string; fallbackLabel: string; highlighted?: boolean }) {
  const texture = useLoader(TextureLoader, photoUrl);
  return (
    <meshStandardMaterial
      map={texture}
      emissive={highlighted ? '#3b82f6' : '#000000'}
      emissiveIntensity={highlighted ? 0.25 : 0}
    />
  );
}

function PlaceholderMaterial({
  fallbackLabel,
  highlighted,
}: { fallbackLabel: string; highlighted?: boolean }) {
  const texture = useMemo(() => makePlaceholderTexture(fallbackLabel), [fallbackLabel]);
  return (
    <meshStandardMaterial
      map={texture}
      emissive={highlighted ? '#3b82f6' : '#000000'}
      emissiveIntensity={highlighted ? 0.25 : 0}
    />
  );
}

/* --- Wall component --- */
function Wall({
  position,
  rotationY,
  width,
  height,
  photoUrl,
  fallbackLabel,
  onClick,
  highlighted,
}: {
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  photoUrl?: string;
  fallbackLabel: string;
  onClick?: () => void;
  highlighted?: boolean;
}) {
  return (
    <mesh
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <planeGeometry args={[width, height]} />
      {photoUrl ? (
        <Suspense fallback={<meshStandardMaterial color="#3a3a3a" />}>
          <PhotoTexturedMaterial photoUrl={photoUrl} fallbackLabel={fallbackLabel} highlighted={highlighted} />
        </Suspense>
      ) : (
        <PlaceholderMaterial fallbackLabel={fallbackLabel} highlighted={highlighted} />
      )}
    </mesh>
  );
}

/* --- Hotspot pin: pure 3D, no Html --- */
function Hotspot({
  position,
  onClick,
  active,
}: {
  position: [number, number, number];
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <group position={position}>
      {/* outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.6, 24]} />
        <meshBasicMaterial color={active ? '#fbbf24' : '#3b82f6'} transparent opacity={0.6} />
      </mesh>
      {/* clickable sphere */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color={active ? '#fbbf24' : '#3b82f6'}
          emissive={active ? '#fbbf24' : '#3b82f6'}
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  );
}

/* --- Roof (simple pitched) --- */
function Roof({ width, depth, height, photoUrl }: { width: number; depth: number; height: number; photoUrl?: string }) {
  const slopeAngle = Math.atan(height / (depth / 2));
  const slopeLength = Math.sqrt((depth / 2) ** 2 + height ** 2);

  const SlopeMat = () => (
    photoUrl ? (
      <Suspense fallback={<meshStandardMaterial color="#5a4a3a" side={2} />}>
        <PhotoTexturedMaterial photoUrl={photoUrl} fallbackLabel="Dach" />
      </Suspense>
    ) : (
      <PlaceholderMaterial fallbackLabel="Dach" />
    )
  );

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, height / 2, depth / 4]} rotation={[-slopeAngle, 0, 0]}>
        <planeGeometry args={[width, slopeLength]} />
        <SlopeMat />
      </mesh>
      <mesh position={[0, height / 2, -depth / 4]} rotation={[slopeAngle, 0, 0]}>
        <planeGeometry args={[width, slopeLength]} />
        <SlopeMat />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -depth / 2, -height / 2, 0,
              depth / 2, -height / 2, 0,
              0, height / 2, 0,
            ]), 3]}
          />
        </bufferGeometry>
        <meshStandardMaterial color="#5a4a3a" side={2} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -depth / 2, -height / 2, 0,
              depth / 2, -height / 2, 0,
              0, height / 2, 0,
            ]), 3]}
          />
        </bufferGeometry>
        <meshStandardMaterial color="#5a4a3a" side={2} />
      </mesh>
    </group>
  );
}

/* --- Spinning hint indicator --- */
function GroundDisc() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[12, 64]} />
      <meshStandardMaterial color="#1a1a1a" />
    </mesh>
  );
}

/* --- Quality → U-value table (W/m²K) --- */
const QUALITY_U: Record<string, { walls: number; windows: number; roof: number; floor: number }> = {
  Poor: { walls: 1.4, windows: 2.6, roof: 1.0, floor: 1.2 },
  Average: { walls: 0.7, windows: 1.4, roof: 0.45, floor: 0.6 },
  Good: { walls: 0.22, windows: 0.9, roof: 0.18, floor: 0.25 },
};

const TARGET_U = { walls: 0.2, windows: 0.9, roof: 0.15, floor: 0.25 };

const QUALITY_PL: Record<string, string> = { Poor: 'Słaba', Average: 'Średnia', Good: 'Dobra' };

const SUGGESTIONS: Record<EnvelopeKey, Record<string, string>> = {
  walls: {
    Poor: 'Pilnie ociepl ściany 20 cm styropianu lub wełny mineralnej (λ=0.035). Największy potencjał oszczędności.',
    Average: 'Dołóż 10–15 cm dodatkowej izolacji + odśwież elewację.',
    Good: 'Stan dobry — kontroluj jedynie mostki termiczne na narożnikach i nadprożach.',
  },
  windows: {
    Poor: 'Wymień stolarkę na 3-szybową (Uw≤0.9). ROI 7–12 lat.',
    Average: 'Rozważ wymianę okien południowych w pierwszej kolejności.',
    Good: 'Okna nowoczesne — sprawdź szczelność uszczelek.',
  },
  roof: {
    Poor: 'Ociepl dach 30 cm wełny mineralnej między i pod krokwiami + folia paroizolacyjna.',
    Average: 'Dołóż 15 cm wełny od strony poddasza.',
    Good: 'Izolacja dachu wystarczająca — sprawdź brak mostków przy kalenicy.',
  },
  floor: {
    Poor: 'Ociepl podłogę na gruncie/strop nad piwnicą 10–15 cm XPS.',
    Average: 'Rozważ dodatkową warstwę 8 cm w trakcie remontu posadzki.',
    Good: 'Stan podłogi dobry.',
  },
};

const UPGRADE_COST_PER_M2: Record<EnvelopeKey, number> = {
  walls: 220,
  windows: 1800,
  roof: 280,
  floor: 200,
};

function buildEnvelopeInfo(analysis: DetailedHouseAnalysis, area: number, floors: number): Record<EnvelopeKey, HotspotInfo> {
  const wallQ = analysis.wall_insulation?.quality || 'Average';
  const winQ = analysis.windows?.quality || 'Average';
  const roofQ = analysis.roof?.quality || 'Average';
  const floorQ = 'Average';

  const dT = 22; // delta T °C average heating season
  const wallArea = Math.sqrt(area / floors) * 4 * (floors * 2.8) * 0.85; // rough
  const wwr = (analysis.geometry?.wwr_percent ?? 18) / 100;
  const windowArea = wallArea * wwr;
  const wallNetArea = wallArea - windowArea;
  const roofArea = area / floors * 1.15;
  const floorArea = area / floors;

  const dist = analysis.heat_loss_distribution ?? {
    walls_percent: 35, roof_percent: 25, windows_percent: 20, floor_percent: 10, ventilation_percent: 7, thermal_bridges_percent: 3,
  };

  const calc = (key: EnvelopeKey, q: string, areaM2: number, faceName: string): HotspotInfo => {
    const u = QUALITY_U[q]?.[key] ?? QUALITY_U.Average[key];
    const lossKw = (u * areaM2 * dT) / 1000;
    const lossPercent = dist[`${key}_percent` as keyof typeof dist] as number;
    return {
      key,
      faceName,
      uValue: u,
      lossKw,
      lossPercent,
      quality: q,
      suggestion: SUGGESTIONS[key][q] ?? SUGGESTIONS[key].Average,
      upgradeCost: Math.round(areaM2 * UPGRADE_COST_PER_M2[key]),
      upgradeUValue: TARGET_U[key],
    };
  };

  return {
    walls: calc('walls', wallQ, wallNetArea, 'Ściany zewnętrzne'),
    windows: calc('windows', winQ, windowArea, 'Okna i stolarka'),
    roof: calc('roof', roofQ, roofArea, 'Dach / stropodach'),
    floor: calc('floor', floorQ, floorArea, 'Podłoga / strop nad piwnicą'),
  };
}

/* --- Main scene --- */
function Scene({
  analysis,
  labeledPhotos,
  selectedKey,
  onHotspot,
}: Props & { selectedKey: EnvelopeKey | null; onHotspot: (k: EnvelopeKey) => void }) {
  const photoMap = useMemo(() => {
    const m: Record<string, string> = {};
    labeledPhotos.forEach((p) => { m[p.label] = p.preview; });
    return m;
  }, [labeledPhotos]);

  const area = analysis.total_heated_area || analysis.estimated_sqm || 120;
  const floors = Math.max(1, analysis.floors || 1);
  const footprintArea = area / floors;
  const aspect = 1.3;
  const depth = Math.sqrt(footprintArea / aspect);
  const width = depth * aspect;
  const floorHeight = 2.8;
  const totalHeight = floors * floorHeight;
  const roofHeight = Math.min(width, depth) * 0.35;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.4} />

      <GroundDisc />

      {/* Walls — clickable */}
      <Wall
        position={[0, totalHeight / 2, depth / 2 + 0.01]}
        rotationY={0} width={width} height={totalHeight}
        photoUrl={photoMap['Przód budynku']} fallbackLabel="Przód"
        onClick={() => onHotspot('walls')} highlighted={selectedKey === 'walls'}
      />
      <Wall
        position={[0, totalHeight / 2, -depth / 2 - 0.01]}
        rotationY={Math.PI} width={width} height={totalHeight}
        photoUrl={photoMap['Tył budynku']} fallbackLabel="Tył"
        onClick={() => onHotspot('walls')} highlighted={selectedKey === 'walls'}
      />
      <Wall
        position={[-width / 2 - 0.01, totalHeight / 2, 0]}
        rotationY={-Math.PI / 2} width={depth} height={totalHeight}
        photoUrl={photoMap['Strona lewa']} fallbackLabel="Lewa"
        onClick={() => onHotspot('windows')} highlighted={selectedKey === 'windows'}
      />
      <Wall
        position={[width / 2 + 0.01, totalHeight / 2, 0]}
        rotationY={Math.PI / 2} width={depth} height={totalHeight}
        photoUrl={photoMap['Strona prawa']} fallbackLabel="Prawa"
        onClick={() => onHotspot('windows')} highlighted={selectedKey === 'windows'}
      />

      {/* Roof */}
      <group
        position={[0, totalHeight, 0]}
        onClick={(e) => { e.stopPropagation(); onHotspot('roof'); }}
      >
        <Roof width={width} depth={depth} height={roofHeight} photoUrl={photoMap['Dach / z góry']} />
      </group>

      {/* Hotspot pins — numbered */}
      <Hotspot position={[width / 2 + 0.6, totalHeight * 0.55, depth / 2 + 0.6]} active={selectedKey === 'walls'} onClick={() => onHotspot('walls')} />
      <Hotspot position={[-width / 2 - 0.6, totalHeight * 0.7, depth / 2 + 0.6]} active={selectedKey === 'windows'} onClick={() => onHotspot('windows')} />
      <Hotspot position={[0, totalHeight + roofHeight * 0.6, 0]} active={selectedKey === 'roof'} onClick={() => onHotspot('roof')} />
      <Hotspot position={[width / 2 + 0.6, 0.4, depth / 2 + 0.6]} active={selectedKey === 'floor'} onClick={() => onHotspot('floor')} />

      <OrbitControls
        enablePan={false}
        minDistance={Math.max(width, depth) * 0.8}
        maxDistance={Math.max(width, depth) * 4}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, totalHeight / 2, 0]}
      />
    </>
  );
}

const Building3DModel = ({ analysis, labeledPhotos }: Props) => {
  const [selectedKey, setSelectedKey] = useState<EnvelopeKey | null>(null);

  const area = analysis.total_heated_area || analysis.estimated_sqm || 120;
  const floors = Math.max(1, analysis.floors || 1);
  const envelopeInfo = useMemo(() => buildEnvelopeInfo(analysis, area, floors), [analysis, area, floors]);
  const selected = selectedKey ? envelopeInfo[selectedKey] : null;

  const missingFaces = ['Przód budynku', 'Tył budynku', 'Strona lewa', 'Strona prawa', 'Dach / z góry']
    .filter((label) => !labeledPhotos.find((p) => p.label === label));

  const HOTSPOT_LIST: { key: EnvelopeKey; n: number }[] = [
    { key: 'walls', n: 1 },
    { key: 'windows', n: 2 },
    { key: 'roof', n: 3 },
    { key: 'floor', n: 4 },
  ];

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-border bg-gradient-to-b from-sky-900/30 to-stone-900/50" style={{ height: 380 }}>
        <Canvas camera={{ position: [12, 8, 14], fov: 45 }} shadows>
          <Suspense fallback={null}>
            <Scene
              analysis={analysis}
              labeledPhotos={labeledPhotos}
              selectedKey={selectedKey}
              onHotspot={setSelectedKey}
            />
          </Suspense>
        </Canvas>

        {/* Floating info panel */}
        {selected && (
          <div className="absolute top-3 right-3 left-3 md:left-auto md:w-72 bg-card/95 backdrop-blur border border-border rounded-xl p-3 shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hotspot #{HOTSPOT_LIST.find(h => h.key === selected.key)?.n}</p>
                <p className="text-sm font-bold text-foreground">{selected.faceName}</p>
              </div>
              <button
                onClick={() => setSelectedKey(null)}
                className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">U-value</p>
                <p className="text-sm font-bold text-foreground">{selected.uValue.toFixed(2)}</p>
                <p className="text-[8px] text-muted-foreground">W/m²K</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">Strata</p>
                <p className="text-sm font-bold text-destructive">{selected.lossKw.toFixed(1)}</p>
                <p className="text-[8px] text-muted-foreground">kW</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">Udział</p>
                <p className="text-sm font-bold text-foreground">{selected.lossPercent}%</p>
                <p className="text-[8px] text-muted-foreground">strat</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-2 mb-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Jakość izolacji</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                selected.quality === 'Good' ? 'bg-green-500/20 text-green-500'
                : selected.quality === 'Average' ? 'bg-amber-500/20 text-amber-500'
                : 'bg-red-500/20 text-red-500'
              }`}>{QUALITY_PL[selected.quality] ?? selected.quality}</span>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mb-2">
              <p className="text-[10px] font-medium text-primary mb-0.5 flex items-center gap-1">
                <Info className="h-3 w-3" /> Sugestia AI
              </p>
              <p className="text-[11px] text-foreground leading-snug">{selected.suggestion}</p>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Po modernizacji: U={selected.upgradeUValue}</span>
              <span className="font-bold text-foreground">~{(selected.upgradeCost / 1000).toFixed(1)}k zł</span>
            </div>
          </div>
        )}

        {/* Hint badge */}
        {!selected && (
          <div className="absolute top-3 left-3 bg-card/90 backdrop-blur border border-border rounded-lg px-2.5 py-1.5 text-[10px] text-foreground flex items-center gap-1.5">
            <Info className="h-3 w-3 text-primary" />
            Kliknij ścianę lub niebieski znacznik
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <RotateCcw className="h-3 w-3" />
          <span>Przeciągnij = obrót · scroll = zoom · klik = info</span>
        </div>
        <span>{labeledPhotos.length} / 5 elewacji</span>
      </div>

      {/* Quick hotspot buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {HOTSPOT_LIST.map(({ key, n }) => {
          const info = envelopeInfo[key];
          const isActive = selectedKey === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedKey(isActive ? null : key)}
              className={`text-left rounded-lg p-2 border transition-colors ${
                isActive ? 'bg-primary/10 border-primary/40' : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">{n}</span>
                <span className="text-[10px] font-medium text-foreground truncate">{info.faceName}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">U={info.uValue.toFixed(2)} · {info.lossPercent}%</p>
            </button>
          );
        })}
      </div>

      {missingFaces.length > 0 && (
        <div className="rounded-xl bg-muted/30 border border-border p-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1.5">
            <Camera className="h-3.5 w-3.5" /> Brakujące zdjęcia (szare ściany w modelu)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingFaces.map((f) => (
              <span key={f} className="text-[10px] bg-background border border-border px-2 py-0.5 rounded-lg text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">ℹ️ Model uproszczony (MVP)</p>
        <p>Bryła z analizy AI: {analysis.floors} kondygnacja(e), ~{area} m². Hotspoty pokazują szacunkowe U-value, straty i sugestie modernizacji.</p>
      </div>
    </div>
  );
};

export default Building3DModel;

