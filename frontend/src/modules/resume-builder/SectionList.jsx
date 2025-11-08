import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableSection = ({ section, index, onUpdateSection, onDeleteItem, onAddItem, editingId, setEditingId, editData, setEditData, renderItemContent, getDefaultItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddItemClick = () => {
    const newItem = {
      id: Date.now().toString(),
      ...getDefaultItem(section.type),
    };
    onAddItem(section.id, newItem);
    setEditingId(`${section.id}-${newItem.id}`);
    setEditData(newItem);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg border-2 ${
        isDragging ? "border-blue-500 shadow-2xl z-50" : "border-gray-200"
      } transition-all`}
    >
      <div className="border-b border-gray-200">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-between p-4 pb-3 cursor-move hover:bg-gray-100 rounded-t-lg select-none"
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl text-gray-500">☰</span>
            <h3 className="font-bold text-lg text-gray-800">{section.title}</h3>
          </div>
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddItemClick();
              }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              type="button"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="space-y-2 min-h-[40px]">
          {section.items && section.items.length > 0 ? (
            section.items.map((item) => {
              const itemId = item.id || `fallback-${section.id}-${Date.now()}`;
              return (
                <div key={itemId} className="mb-2">
                  <div className="flex items-start gap-2 group">
                    <div className="mt-2 cursor-move text-gray-400 hover:text-blue-600 flex-shrink-0 transition-colors" title="Items can be reordered by editing">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="group-hover:scale-110 transition-transform opacity-50"
                      >
                        <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      {renderItemContent(section, item)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 italic">
                No items yet. Click + Add to add items.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionList = ({ sections, onUpdateSection, onDeleteItem, onAddItem, onDragEnd }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEdit = (sectionId, itemId) => {
    const section = sections.find((s) => s.id === sectionId);
    const item = section?.items.find((i) => i.id === itemId);
    if (item) {
      setEditingId(`${sectionId}-${itemId}`);
      setEditData({ ...item });
    }
  };

  const handleSave = (sectionId, itemId) => {
    onUpdateSection(sectionId, itemId, editData);
    setEditingId(null);
    setEditData({});
  };

  const handleAddItem = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newItem = {
      id: Date.now().toString(),
      ...getDefaultItem(section.type),
    };
    onAddItem(sectionId, newItem);
    setEditingId(`${sectionId}-${newItem.id}`);
    setEditData(newItem);
  };

  const getDefaultItem = (type) => {
    switch (type) {
      case "education":
        return { degree: "", school: "", year: "", gpa: "" };
      case "experience":
        return { title: "", company: "", duration: "", description: "" };
      case "skills":
        return { category: "", items: [] };
      case "projects":
        return { title: "", description: "", technologies: [], link: "" };
      case "achievements":
        return { title: "", description: "", date: "" };
      default:
        return {};
    }
  };

  const renderItemContent = (section, item) => {
    if (editingId === `${section.id}-${item.id}`) {
      return (
        <div className="p-3 bg-white border rounded-lg space-y-2">
          {Object.keys(editData).map((key) => {
            if (key === "id") return null;
            if (Array.isArray(editData[key])) {
              return (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <input
                    type="text"
                    value={editData[key].join(", ")}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        [key]: e.target.value.split(",").map((t) => t.trim()),
                      })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder={`Enter ${key} (comma-separated)`}
                  />
                </div>
              );
            }
            return (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                {key === "description" ? (
                  <textarea
                    value={editData[key] || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, [key]: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                    rows="3"
                  />
                ) : (
                  <input
                    type="text"
                    value={editData[key] || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, [key]: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                )}
              </div>
            );
          })}
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(section.id, item.id)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setEditData({});
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {section.type === "education" && (
              <div>
                <h4 className="font-semibold">{item.degree || "Degree"}</h4>
                <p className="text-sm text-gray-600">{item.school || "School"}</p>
                <p className="text-xs text-gray-500">{item.year || "Year"}</p>
              </div>
            )}
            {section.type === "experience" && (
              <div>
                <h4 className="font-semibold">{item.title || "Job Title"}</h4>
                <p className="text-sm text-gray-600">{item.company || "Company"}</p>
                <p className="text-xs text-gray-500">{item.duration || "Duration"}</p>
                <p className="text-sm mt-1">{item.description || "Description"}</p>
              </div>
            )}
            {section.type === "skills" && (
              <div>
                <h4 className="font-semibold">{item.category || "Category"}</h4>
                <p className="text-sm text-gray-600">
                  {Array.isArray(item.items) ? item.items.join(", ") : item.items || "Skills"}
                </p>
              </div>
            )}
            {section.type === "projects" && (
              <div>
                <h4 className="font-semibold">{item.title || "Project Title"}</h4>
                <p className="text-sm text-gray-600">{item.description || "Description"}</p>
                <p className="text-xs text-gray-500">
                  {Array.isArray(item.technologies) ? item.technologies.join(", ") : ""}
                </p>
              </div>
            )}
            {section.type === "achievements" && (
              <div>
                <h4 className="font-semibold">{item.title || "Achievement"}</h4>
                <p className="text-sm text-gray-600">{item.description || "Description"}</p>
                <p className="text-xs text-gray-500">{item.date || "Date"}</p>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(section.id, item.id)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteItem(section.id, item.id)}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleSectionDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = sections.findIndex((s) => `section-${s.id}` === active.id);
    const overIndex = sections.findIndex((s) => `section-${s.id}` === over.id);

    if (activeIndex !== -1 && overIndex !== -1 && onDragEnd) {
      onDragEnd({
        type: "SECTION",
        source: { index: activeIndex },
        destination: { index: overIndex },
      });
    }
  };

  const sectionIds = sections.map((s) => `section-${s.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleSectionDragEnd}
    >
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SortableSection
              key={section.id}
              section={section}
              index={index}
              onUpdateSection={onUpdateSection}
              onDeleteItem={onDeleteItem}
              onAddItem={handleAddItem}
              editingId={editingId}
              setEditingId={setEditingId}
              editData={editData}
              setEditData={setEditData}
              renderItemContent={renderItemContent}
              getDefaultItem={getDefaultItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SectionList;
