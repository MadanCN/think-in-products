"use client";

import { GripVertical, Plus } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { AdminPhase } from "@/app/actions/roadmap";

// ─── Sortable phase item ──────────────────────────────────────────────────────

function SortablePhaseItem({
  phase,
  active,
  onClick,
}: {
  phase: AdminPhase;
  active: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...(active ? { borderLeftColor: phase.color } : {}),
        ...style,
      }}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100 group",
        "border-l-2",
        active
          ? "bg-bg-card border-l-2 text-accent-primary"
          : "border-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary",
        isDragging && "opacity-40"
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Color dot */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: phase.color }}
      />

      {/* Title */}
      <span className="flex-1 text-sm font-medium truncate">{phase.title}</span>

      {/* Node count */}
      <span
        className={cn(
          "shrink-0 font-mono text-2xs px-1.5 py-0.5 rounded-md border",
          active
            ? "bg-accent-primary/15 border-accent-primary/25 text-accent-primary"
            : "bg-bg-secondary border-border text-text-muted"
        )}
      >
        {phase.node_count}
      </span>
    </div>
  );
}

// ─── Phase list ───────────────────────────────────────────────────────────────

interface PhaseListProps {
  phases: AdminPhase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (newPhases: AdminPhase[]) => void;
  onAddPhase: () => void;
}

export function PhaseList({
  phases,
  selectedId,
  onSelect,
  onReorder,
  onAddPhase,
}: PhaseListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = phases.findIndex((p) => p.id === active.id);
    const newIndex = phases.findIndex((p) => p.id === over.id);
    onReorder(arrayMove(phases, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={phases.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {phases.map((phase) => (
                <SortablePhaseItem
                  key={phase.id}
                  phase={phase}
                  active={selectedId === phase.id}
                  onClick={() => onSelect(phase.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {phases.length === 0 && (
          <p className="text-center text-text-muted font-mono text-xs py-8">
            No phases yet.
          </p>
        )}
      </div>

      {/* Add phase button */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={onAddPhase}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-accent-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Phase
        </button>
      </div>
    </div>
  );
}
