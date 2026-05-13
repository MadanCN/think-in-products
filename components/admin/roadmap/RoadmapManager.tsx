"use client";

import { useState, useEffect, useCallback } from "react";
import { PhaseList } from "./PhaseList";
import { NodeGrid } from "./NodeGrid";
import { PhaseForm } from "./PhaseForm";
import { NodeForm } from "./NodeForm";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useToast, ToastContainer } from "@/components/admin/Toast";
import {
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhases,
  getNodesForPhase,
  createNode,
  updateNode,
  deleteNode,
  toggleNodePublished,
  reorderNodes,
  moveNodeToPhase,
} from "@/app/actions/roadmap";
import type {
  AdminPhase,
  AdminNode,
  PhaseInput,
  NodeInput,
} from "@/app/actions/roadmap";

interface RoadmapManagerProps {
  initialPhases: AdminPhase[];
}

export function RoadmapManager({ initialPhases }: RoadmapManagerProps) {
  const [phases, setPhases] = useState<AdminPhase[]>(initialPhases);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(
    initialPhases[0]?.id ?? null
  );
  const [nodes, setNodes] = useState<AdminNode[]>([]);
  const [nodesLoading, setNodesLoading] = useState(false);

  const [phaseFormOpen, setPhaseFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<AdminPhase | null>(null);
  const [nodeFormOpen, setNodeFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<AdminNode | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "phase" | "node";
    item: AdminPhase | AdminNode;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Move node state
  const [movingNode, setMovingNode] = useState<AdminNode | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);

  const { toasts, toast, dismiss } = useToast();

  const loadNodes = useCallback(async (phaseId: string) => {
    setNodesLoading(true);
    try {
      const data = await getNodesForPhase(phaseId);
      setNodes(data);
    } catch {
      toast({ message: "Failed to load nodes", type: "error" });
    } finally {
      setNodesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedPhaseId) loadNodes(selectedPhaseId);
    else setNodes([]);
  }, [selectedPhaseId, loadNodes]);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? null;

  async function handleSavePhase(input: Omit<PhaseInput, "order_index">, id?: string) {
    if (id) {
      const updated = await updatePhase(id, input);
      setPhases((prev) => prev.map((p) => (p.id === id ? { ...updated, node_count: p.node_count } : p)));
      toast({ message: "Phase updated" });
    } else {
      const created = await createPhase(input);
      setPhases((prev) => [...prev, created]);
      setSelectedPhaseId(created.id);
      toast({ message: "Phase created" });
    }
  }

  async function handleReorderPhases(newPhases: AdminPhase[]) {
    setPhases(newPhases);
    try {
      await reorderPhases(newPhases.map((p) => p.id));
    } catch {
      setPhases(phases);
      toast({ message: "Failed to save order", type: "error" });
    }
  }

  async function handleDeletePhase() {
    if (!confirmDelete || confirmDelete.type !== "phase") return;
    setDeleteLoading(true);
    try {
      const phase = confirmDelete.item as AdminPhase;
      await deletePhase(phase.id);
      setPhases((prev) => prev.filter((p) => p.id !== phase.id));
      if (selectedPhaseId === phase.id) {
        setSelectedPhaseId(phases.find((p) => p.id !== phase.id)?.id ?? null);
      }
      toast({ message: "Phase deleted" });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Failed to delete phase", type: "error" });
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  }

  async function handleSaveNode(input: NodeInput, id?: string) {
    if (id) {
      const updated = await updateNode(id, input);
      setNodes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      toast({ message: "Node updated" });
    } else {
      const created = await createNode(input);
      setNodes((prev) => [...prev, created]);
      setPhases((prev) =>
        prev.map((p) =>
          p.id === input.phase_id ? { ...p, node_count: p.node_count + 1 } : p
        )
      );
      toast({ message: "Node created" });
    }
  }

  async function handleTogglePublished(id: string, val: boolean) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, is_published: val } : n)));
    try {
      await toggleNodePublished(id, val);
    } catch {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, is_published: !val } : n)));
      toast({ message: "Failed to update status", type: "error" });
    }
  }

  async function handleReorderNodes(newNodes: AdminNode[]) {
    setNodes(newNodes);
    try {
      if (selectedPhaseId) {
        await reorderNodes(selectedPhaseId, newNodes.map((n) => n.id));
      }
    } catch {
      setNodes(nodes);
      toast({ message: "Failed to save order", type: "error" });
    }
  }

  async function handleDeleteNode() {
    if (!confirmDelete || confirmDelete.type !== "node") return;
    setDeleteLoading(true);
    try {
      const node = confirmDelete.item as AdminNode;
      await deleteNode(node.id);
      setNodes((prev) => prev.filter((n) => n.id !== node.id));
      setPhases((prev) =>
        prev.map((p) =>
          p.id === node.phase_id ? { ...p, node_count: Math.max(0, p.node_count - 1) } : p
        )
      );
      toast({ message: "Node deleted" });
    } catch {
      toast({ message: "Failed to delete node", type: "error" });
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  }

  async function handleMoveNode(targetPhaseId: string) {
    if (!movingNode) return;
    setMoveLoading(true);
    try {
      await moveNodeToPhase(movingNode.id, targetPhaseId);
      // Remove from current phase view
      setNodes((prev) => prev.filter((n) => n.id !== movingNode.id));
      setPhases((prev) =>
        prev.map((p) => {
          if (p.id === movingNode.phase_id) return { ...p, node_count: Math.max(0, p.node_count - 1) };
          if (p.id === targetPhaseId) return { ...p, node_count: p.node_count + 1 };
          return p;
        })
      );
      toast({ message: `Moved to ${phases.find((p) => p.id === targetPhaseId)?.title ?? "phase"}` });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Move failed", type: "error" });
    } finally {
      setMoveLoading(false);
      setMovingNode(null);
    }
  }

  const phaseHasNodes = (selectedPhase?.node_count ?? 0) > 0;

  return (
    <>
      <div className="flex -m-8 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left — phase list */}
        <aside className="w-[280px] shrink-0 border-r border-border flex flex-col bg-bg-secondary/20">
          <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
            <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
              Phases
            </span>
          </div>
          <PhaseList
            phases={phases}
            selectedId={selectedPhaseId}
            onSelect={setSelectedPhaseId}
            onReorder={handleReorderPhases}
            onAddPhase={() => {
              setEditingPhase(null);
              setPhaseFormOpen(true);
            }}
          />
        </aside>

        {/* Right — node grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <NodeGrid
            phase={selectedPhase}
            nodes={nodes}
            loading={nodesLoading}
            phases={phases}
            canDeletePhase={!phaseHasNodes}
            onEditPhase={() => {
              if (selectedPhase) {
                setEditingPhase(selectedPhase);
                setPhaseFormOpen(true);
              }
            }}
            onDeletePhase={() => {
              if (selectedPhase) setConfirmDelete({ type: "phase", item: selectedPhase });
            }}
            onAddNode={() => {
              setEditingNode(null);
              setNodeFormOpen(true);
            }}
            onEditNode={(node) => {
              setEditingNode(node);
              setNodeFormOpen(true);
            }}
            onDeleteNode={(node) => setConfirmDelete({ type: "node", item: node })}
            onTogglePublished={handleTogglePublished}
            onReorder={handleReorderNodes}
            onMoveNode={(node) => setMovingNode(node)}
          />
        </div>
      </div>

      <PhaseForm
        open={phaseFormOpen}
        phase={editingPhase}
        onClose={() => setPhaseFormOpen(false)}
        onSave={handleSavePhase}
      />

      {selectedPhaseId && (
        <NodeForm
          open={nodeFormOpen}
          node={editingNode}
          phaseId={selectedPhaseId}
          onClose={() => setNodeFormOpen(false)}
          onSave={handleSaveNode}
        />
      )}

      {/* Move node modal */}
      {movingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-border rounded-2xl p-6 w-80 shadow-2xl space-y-4">
            <p className="font-display font-bold text-text-primary text-sm">Move node to phase</p>
            <p className="font-mono text-xs text-text-muted line-clamp-2">{movingNode.title}</p>
            <div className="space-y-1.5">
              {phases
                .filter((p) => p.id !== movingNode.phase_id)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleMoveNode(p.id)}
                    disabled={moveLoading}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:border-accent-primary/40 hover:bg-white/5 text-left transition-colors disabled:opacity-50"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-text-primary truncate">{p.title}</span>
                    <span className="ml-auto font-mono text-2xs text-text-muted">{p.node_count} nodes</span>
                  </button>
                ))}
            </div>
            <button
              onClick={() => setMovingNode(null)}
              className="w-full py-2 rounded-xl border border-border text-text-muted text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.type ?? "item"}?`}
        message={
          confirmDelete?.type === "phase"
            ? `"${(confirmDelete.item as AdminPhase).title}" will be permanently deleted.`
            : `"${(confirmDelete?.item as AdminNode)?.title}" will be permanently deleted.`
        }
        loading={deleteLoading}
        onConfirm={confirmDelete?.type === "phase" ? handleDeletePhase : handleDeleteNode}
        onCancel={() => setConfirmDelete(null)}
      />

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
