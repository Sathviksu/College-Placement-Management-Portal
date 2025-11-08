import React from "react";

const ThemeSelector = ({ theme, onThemeChange }) => {
  const themes = [
    { id: "Classic", name: "Classic", preview: "bg-blue-50" },
    { id: "Modern", name: "Modern", preview: "bg-gray-900" },
  ];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Theme
      </label>
      <div className="flex gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => onThemeChange(t.id)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              theme === t.id
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;

