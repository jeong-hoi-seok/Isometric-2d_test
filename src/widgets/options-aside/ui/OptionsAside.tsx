import { GridPanel } from '../../../features/edit-island-map/ui/GridPanel';
import { PlacementPanel } from '../../../features/place-assets/ui/PlacementPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

export type AsideTab = 'place' | 'grid';

interface Props {
  activeTab: AsideTab;
  onTabChange: (tab: AsideTab) => void;
}

export function OptionsAside({ activeTab, onTabChange }: Props) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card/50 p-4">
      <h1 className="text-lg font-semibold">아이소메트릭 섬 배치</h1>
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as AsideTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="place" className="flex-1">
            배치
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex-1">
            그리드
          </TabsTrigger>
        </TabsList>
        <TabsContent value="place" className="mt-4">
          <PlacementPanel />
        </TabsContent>
        <TabsContent value="grid" className="mt-4">
          <GridPanel />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
