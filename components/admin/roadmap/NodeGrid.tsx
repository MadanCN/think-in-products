"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NodeCard } from "./NodeCard";
import type { AdminNode, AdminPhase } from "@/app/actions/roadmap";

function SortableNodeCard({
  node,
  phases,
  onToggle,
  onEdit,
  onDelete,
  onMove,
}: {
  node: AdminNode;
  phases: AdminPhase[];
  onToggle: (id: string, val: boolean) => void;
  onEdit: (n: AdminNode) => void;
  onDelete: (n: AdminNode) => void;
  onMove: (n: AdminNode) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <NodeCard
        node={node}
        phases={phases}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        onTogglePublished={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
      />
    </div>
  );
}

interface NodeGridProps {
  phase: AdminPhase | null;
  nodes: AdminNode[];
  loading: boolean;
  phases: AdminPhase[];
  canDeletePhase: boolean;
  onEditPhase: () => void;
  onDeletePhase: () => void;
  onAddNode: () => void;
  onEditNode: (node: AdminNode) => void;
  onDeleteNode: (node: AdminNode) => void;
  onTogglePublished: (id: string, val: boolean) => void;
  onReorder: (newNodes: AdminNode[]) => void;
  onMoveNode: (node: AdminNode) => void;
}

export function NodeGrid({
  phase,
  nodes,
  loading,
  phases,
  canDeletePhase,
  onEditPhase,
  onDeletePhase,
  onAddNode,
  onEditNode,
  onDeleteNode,
  onTogglePublished,
  onReorder,
  onMoveNode,
}: NodeGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = nodes.findIndex((n) => n.id === active.id);
    const newIndex = nodes.findIndex((n) => n.id === over.id);
    onReorder(arrayMove(nodes, oldIndex, newIndex));
  }

  if (!phase) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted font-mono text-sm">
        Select a phase to manage its nodes.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Phase header */}
      <div
        className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0"
        style={{ borderBottomColor: `${phase.color}33` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
          <h2 className="font-display text-base font-bold text-text-primary">
            {phase.title}
          </h2>
          <button
            onClick={onEditPhase}
            className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
            title="Edit phase"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={canDeletePhase ? onDeletePhase : undefined}
            disabled={!canDeletePhase}
            title={canDeletePhase ? "Delete phase" : "Remove all nodes before deleting this phase"}
            className="p-1 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {!canDeletePhase && (
            <span className="font-mono text-2xs text-text-muted">
              (remove all nodes to delete)
            </span>
          )}
        </div>
        <button
          onClick={onAddNode}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Node
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-text-muted font-mono text-sm">No nodes in this phase.</p>
            <button
              onClick={onAddNode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-text-muted text-xs font-mono hover:border-accent-primary/40 hover:text-accent-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add first node
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={nodes.map((n) => n.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4">
                {nodes.map((node) => (
                  <SortableNodeCard
                    key={node.id}
                    node={node}
                    phases={phases}
                    onToggle={onTogglePublished}
                    onEdit={onEditNode}
                    onDelete={onDeleteNode}
                    onMove={onMoveNode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
