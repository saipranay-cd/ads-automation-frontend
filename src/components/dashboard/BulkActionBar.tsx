"use client";

import { useState } from "react";
import { Pause, Play, DollarSign, X } from "lucide-react";
import { useBulkAction } from "@/hooks/use-campaigns";

interface BulkActionBarProps {
  selectedIds: string[];
  entityLevel: "campaign" | "adset" | "ad";
  onClear: () => void;
}

export function BulkActionBar({
  selectedIds,
  entityLevel,
  onClear,
}: BulkActionBarProps) {
  const bulkAction = useBulkAction();
  const [showBudget, setShowBudget] = useState(false);
  const [budget, setBudget] = useState("");
  const count = selectedIds.length;

  if (count === 0) return null;

  const handlePause = () => {
    bulkAction.mutate(
      { entityIds: selectedIds, entityLevel, action: "pause" },
      { onSuccess: onClear },
    );
  };

  const handleActivate = () => {
    bulkAction.mutate(
      { entityIds: selectedIds, entityLevel, action: "activate" },
      { onSuccess: onClear },
    );
  };

  const handleBudget = () => {
    const amount = parseFloat(budget);
    if (!amount || amount <= 0) return;
    bulkAction.mutate(
      {
        entityIds: selectedIds,
        entityLevel,
        action: "update_budget",
        params: { daily_budget: amount },
      },
      {
        onSuccess: () => {
          onClear();
          setShowBudget(false);
          setBudget("");
        },
      },
    );
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl px-5 py-3 shadow-lg"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-default)",
      }}
    >
      <span
        className="text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {count} selected
      </span>

      <div
        className="h-5 w-px"
        style={{ background: "var(--border-subtle)" }}
      />

      <button
        onClick={handlePause}
        disabled={bulkAction.isPending}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
        style={{
          background: "var(--bg-muted)",
          color: "var(--text-primary)",
        }}
      >
        <Pause size={14} />
        Pause
      </button>

      <button
        onClick={handleActivate}
        disabled={bulkAction.isPending}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
        style={{
          background: "var(--accent-primary)",
          color: "white",
        }}
      >
        <Play size={14} />
        Activate
      </button>

      {showBudget ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="₹ Daily"
            className="w-24 rounded-lg px-2.5 py-1.5 text-sm font-mono"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleBudget()}
          />
          <button
            onClick={handleBudget}
            disabled={bulkAction.isPending || !budget}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium disabled:opacity-50"
            style={{
              background: "var(--accent-primary)",
              color: "white",
            }}
          >
            Set
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowBudget(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{
            background: "var(--bg-muted)",
            color: "var(--text-primary)",
          }}
        >
          <DollarSign size={14} />
          Set Budget
        </button>
      )}

      <div
        className="h-5 w-px"
        style={{ background: "var(--border-subtle)" }}
      />

      <button
        onClick={onClear}
        className="rounded-lg p-1.5 transition-colors hover:opacity-80"
        style={{ color: "var(--text-tertiary)" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
