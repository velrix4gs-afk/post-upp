import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export interface StoryFilter {
  id: string;
  name: string;
  css: string;
  preview: string;
}

export const storyFilters: StoryFilter[] = [
  { id: 'none', name: 'Original', css: 'none', preview: '' },
  { id: 'clarendon', name: 'Clarendon', css: 'contrast(120%) saturate(125%)', preview: '' },
  { id: 'gingham', name: 'Gingham', css: 'brightness(105%) hue-rotate(-10deg)', preview: '' },
  { id: 'moon', name: 'Moon', css: 'grayscale(100%) contrast(110%) brightness(110%)', preview: '' },
  { id: 'lark', name: 'Lark', css: 'contrast(90%) saturate(90%) brightness(110%)', preview: '' },
  { id: 'reyes', name: 'Reyes', css: 'sepia(22%) contrast(85%) brightness(110%) saturate(75%)', preview: '' },
  { id: 'juno', name: 'Juno', css: 'saturate(140%) contrast(110%) brightness(105%) sepia(5%)', preview: '' },
  { id: 'slumber', name: 'Slumber', css: 'saturate(66%) brightness(105%) sepia(10%)', preview: '' },
  { id: 'crema', name: 'Crema', css: 'saturate(90%) contrast(95%) brightness(105%)', preview: '' },
  { id: 'ludwig', name: 'Ludwig', css: 'contrast(105%) saturate(105%) brightness(105%)', preview: '' },
  { id: 'aden', name: 'Aden', css: 'hue-rotate(-20deg) contrast(90%) saturate(85%) brightness(120%)', preview: '' },
  { id: 'perpetua', name: 'Perpetua', css: 'contrast(110%) brightness(110%) saturate(110%)', preview: '' },
  { id: 'amaro', name: 'Amaro', css: 'saturate(150%) brightness(110%) contrast(90%)', preview: '' },
  { id: 'rise', name: 'Rise', css: 'brightness(105%) saturate(90%) sepia(5%)', preview: '' },
  { id: 'hudson', name: 'Hudson', css: 'brightness(120%) contrast(90%) saturate(110%)', preview: '' },
  { id: 'valencia', name: 'Valencia', css: 'contrast(108%) brightness(108%) sepia(8%)', preview: '' },
  { id: 'xpro2', name: 'X-Pro II', css: 'sepia(30%) contrast(120%) saturate(140%)', preview: '' },
  { id: 'sierra', name: 'Sierra', css: 'contrast(85%) brightness(105%) saturate(120%)', preview: '' },
  { id: 'willow', name: 'Willow', css: 'grayscale(50%) contrast(95%) brightness(90%)', preview: '' },
  { id: 'lofi', name: 'Lo-Fi', css: 'saturate(110%) contrast(150%) brightness(90%)', preview: '' },
  { id: 'earlybird', name: 'Earlybird', css: 'sepia(20%) contrast(90%) brightness(105%) saturate(120%)', preview: '' },
  { id: 'brannan', name: 'Brannan', css: 'sepia(50%) contrast(140%) brightness(95%)', preview: '' },
  { id: 'inkwell', name: 'Inkwell', css: 'sepia(30%) contrast(110%) brightness(110%) grayscale(100%)', preview: '' },
  { id: 'hefe', name: 'Hefe', css: 'contrast(150%) saturate(140%) sepia(5%)', preview: '' },
  { id: 'nashville', name: 'Nashville', css: 'sepia(25%) contrast(150%) brightness(105%) saturate(130%)', preview: '' },
];

interface StoryFilterPickerProps {
  selectedFilter: string;
  onSelect: (filterId: string) => void;
  previewUrl: string | null;
}

export const StoryFilterPicker = ({ selectedFilter, onSelect, previewUrl }: StoryFilterPickerProps) => {
  return (
    <div className="py-3">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4">
          {storyFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onSelect(filter.id)}
              className={`flex flex-col items-center gap-1 flex-shrink-0 ${
                selectedFilter === filter.id ? 'opacity-100' : 'opacity-70'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  selectedFilter === filter.id ? 'border-white' : 'border-transparent'
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={filter.name}
                    className="w-full h-full object-cover"
                    style={{ filter: filter.css }}
                  />
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500"
                    style={{ filter: filter.css }}
                  />
                )}
              </div>
              <span className={`text-xs ${selectedFilter === filter.id ? 'text-white font-semibold' : 'text-white/70'}`}>
                {filter.name}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
