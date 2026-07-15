'use client';

import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";

interface SettingsActionsProps {
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
  visible: boolean;
}

const SettingsSaveBar = ({
  onSave,
  onDiscard,
  saving = false,
  visible,
}: SettingsActionsProps) => {

  if (!visible) return null;

  return (
    <div
      className="
        fixed
        bottom-6
        right-6
        z-50
        flex
        items-center
        gap-4
        rounded-xl
        border
        bg-background/95
        backdrop-blur
        shadow-xl
        px-5
        py-4
        animate-in
        slide-in-from-bottom-3
        duration-300
      "
    >
      {/* Info */}
      <div className="mr-4">
        <h4 className="text-sm font-semibold">
          Unsaved Changes
        </h4>

        <p className="text-xs text-muted-foreground">
          Save or discard your recent changes.
        </p>
      </div>

      {/* Discard */}
      <Button
        variant="outline"
        onClick={onDiscard}
        disabled={saving}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Discard
      </Button>

      {/* Save */}
      <Button
        onClick={onSave}
        disabled={saving}
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

export default SettingsSaveBar;