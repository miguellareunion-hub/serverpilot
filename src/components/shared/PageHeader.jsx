import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PageHeader({ title, description, action, onAction, icon: ActionIcon = Plus }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>
      {action && (
        <Button onClick={onAction} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 shrink-0">
          <ActionIcon className="h-4 w-4" />
          {action}
        </Button>
      )}
    </div>
  );
}