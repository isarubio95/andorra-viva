import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SortablePhotoItem {
  id: string;
  src: string;
  isNew?: boolean;
}

interface SortablePhotoGridProps {
  items: SortablePhotoItem[];
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onImageError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

function SortablePhotoCard({
  item,
  index,
  onRemove,
  onImageError,
}: {
  item: SortablePhotoItem;
  index: number;
  onRemove: (index: number) => void;
  onImageError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-4/3 overflow-hidden rounded-lg border bg-muted',
        item.isNew && 'border-dashed',
        isDragging && 'z-10 opacity-60 shadow-lg',
      )}
    >
      <img
        src={item.src}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
        onError={onImageError}
      />

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-full bg-black/50 text-white active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {index === 0 && (
        <Badge className="absolute bottom-2 left-2 text-[10px]">Principal</Badge>
      )}

      {item.isNew && (
        <Badge variant="secondary" className="absolute bottom-2 right-2 text-[10px]">
          Nueva
        </Badge>
      )}

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground sm:h-8 sm:w-8 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
        aria-label="Quitar imagen"
      >
        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
}

export default function SortablePhotoGrid({
  items,
  onReorder,
  onRemove,
  onImageError,
}: SortablePhotoGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = items.findIndex(item => item.id === active.id);
    const to = items.findIndex(item => item.id === over.id);
    if (from !== -1 && to !== -1) {
      onReorder(from, to);
    }
  };

  if (items.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <SortablePhotoCard
              key={item.id}
              item={item}
              index={index}
              onRemove={onRemove}
              onImageError={onImageError}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
