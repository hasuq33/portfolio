export const FieldRenderer = ({ field, value, onChange }: any) => {

  const base = "border p-2 rounded w-full";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {field.label || field.name}
      </label>

      {field.type === "text" && (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={base}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(field.name, Number(e.target.value))}
          className={base}
        />
      )}

      {field.type === "boolean" && (
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(field.name, e.target.checked)}
        />
      )}

      {field.type === "date" && (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={base}
        />
      )}
    </div>
  );
};