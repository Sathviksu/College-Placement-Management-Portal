import React, { useState } from "react";

const ProjectPicker = ({ onAddProject, existingProjects = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [project, setProject] = useState({
    title: "",
    description: "",
    technologies: "",
    link: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (project.title) {
      onAddProject({
        ...project,
        technologies: project.technologies.split(",").map((t) => t.trim()),
        id: Date.now().toString(),
      });
      setProject({ title: "", description: "", technologies: "", link: "" });
      setShowForm(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {showForm ? "Cancel" : "+ Add Project"}
      </button>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            placeholder="Project Title"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <textarea
            placeholder="Description"
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows="3"
          />
          <input
            type="text"
            placeholder="Technologies (comma-separated)"
            value={project.technologies}
            onChange={(e) => setProject({ ...project, technologies: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="url"
            placeholder="Project Link (optional)"
            value={project.link}
            onChange={(e) => setProject({ ...project, link: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Project
          </button>
        </form>
      )}
    </div>
  );
};

export default ProjectPicker;

