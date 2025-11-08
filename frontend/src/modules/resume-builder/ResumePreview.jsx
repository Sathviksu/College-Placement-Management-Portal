import React from "react";

const ResumePreview = ({ resumeData, theme = "Classic" }) => {
  const { userInfo = {}, sections = [] } = resumeData || {};

  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Modern Theme Renderers
  const renderModernEducation = (section) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <div key={section.id} className="mb-6">
        <h2 className="text-lg font-bold text-indigo-600 mb-4 uppercase tracking-wide">{section.title}</h2>
        <div className="space-y-4">
          {section.items.map((item, idx) => (
            <div key={idx} className="pl-4 border-l-2 border-indigo-300">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-gray-800">{item.degree}</h3>
                <span className="text-sm text-indigo-600 font-medium">{item.year}</span>
              </div>
              <p className="text-gray-600 font-medium">{item.school}</p>
              {item.gpa && <p className="text-sm text-gray-500 mt-1">GPA: {item.gpa}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModernExperience = (section) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <div key={section.id} className="mb-6">
        <h2 className="text-lg font-bold text-indigo-600 mb-4 uppercase tracking-wide">{section.title}</h2>
        <div className="space-y-5">
          {section.items.map((item, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                  <p className="text-indigo-600 font-medium">{item.company}</p>
                </div>
                <span className="text-sm text-gray-500 bg-indigo-50 px-2 py-1 rounded">{item.duration}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModernSkills = (section) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <div key={section.id} className="mb-6">
        <h2 className="text-lg font-bold text-indigo-600 mb-4 uppercase tracking-wide">{section.title}</h2>
        <div className="space-y-3">
          {section.items.map((item, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
              {item.category && (
                <h4 className="font-bold text-gray-800 mb-2 text-sm">{item.category}</h4>
              )}
              <div className="flex flex-wrap gap-2">
                {Array.isArray(item.items) ? (
                  item.items.map((skill, skillIdx) => (
                    <span
                      key={skillIdx}
                      className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                    {item.items}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModernProjects = (section) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <div key={section.id} className="mb-6">
        <h2 className="text-lg font-bold text-indigo-600 mb-4 uppercase tracking-wide">{section.title}</h2>
        <div className="grid gap-4">
          {section.items.map((item, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                  >
                    <span>View →</span>
                  </a>
                )}
              </div>
              <p className="text-gray-700 text-sm mb-3 leading-relaxed">{item.description}</p>
              {item.technologies && item.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.technologies.map((tech, techIdx) => (
                    <span
                      key={techIdx}
                      className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModernAchievements = (section) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <div key={section.id} className="mb-6">
        <h2 className="text-lg font-bold text-indigo-600 mb-4 uppercase tracking-wide">{section.title}</h2>
        <div className="space-y-3">
          {section.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  {item.date && <span className="text-xs text-indigo-600 font-medium">{item.date}</span>}
                </div>
                <p className="text-gray-700 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Classic Theme Renderers (original)
  const renderClassicSection = (section) => {
    if (!section.items || section.items.length === 0) return null;

    switch (section.type) {
      case "education":
        return (
          <div key={section.id} className="mb-6">
            <h2 className="text-xl font-bold mb-3 border-b-2 pb-1">{section.title}</h2>
            {section.items.map((item, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{item.degree}</h3>
                    <p className="text-gray-600">{item.school}</p>
                  </div>
                  <span className="text-gray-500">{item.year}</span>
                </div>
                {item.gpa && <p className="text-sm text-gray-600">GPA: {item.gpa}</p>}
              </div>
            ))}
          </div>
        );

      case "experience":
        return (
          <div key={section.id} className="mb-6">
            <h2 className="text-xl font-bold mb-3 border-b-2 pb-1">{section.title}</h2>
            {section.items.map((item, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600">{item.company}</p>
                  </div>
                  <span className="text-gray-500">{item.duration}</span>
                </div>
                <p className="text-sm mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        );

      case "skills":
        return (
          <div key={section.id} className="mb-6">
            <h2 className="text-xl font-bold mb-3 border-b-2 pb-1">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item, idx) => (
                <div key={idx}>
                  {item.category && (
                    <h4 className="font-semibold">{item.category}:</h4>
                  )}
                  <p className="text-gray-700">
                    {Array.isArray(item.items) ? item.items.join(", ") : item.items}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "projects":
        return (
          <div key={section.id} className="mb-6">
            <h2 className="text-xl font-bold mb-3 border-b-2 pb-1">{section.title}</h2>
            {section.items.map((item, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Project
                    </a>
                  )}
                </div>
                <p className="text-sm mt-1 text-gray-700">{item.description}</p>
                {item.technologies && item.technologies.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Technologies: {item.technologies.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case "achievements":
        return (
          <div key={section.id} className="mb-6">
            <h2 className="text-xl font-bold mb-3 border-b-2 pb-1">{section.title}</h2>
            {section.items.map((item, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.date && <span className="text-gray-500 text-sm">{item.date}</span>}
                </div>
                <p className="text-sm text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Modern Theme Layout
  if (theme === "Modern") {
    return (
      <div
        id="resume-preview"
        className="bg-white text-gray-900 p-0 rounded-lg shadow-lg min-h-[800px]"
        style={{ maxWidth: "8.5in", margin: "0 auto" }}
      >
        {/* Modern Header with Sidebar */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-8 rounded-t-lg">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Header Content */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4 tracking-tight">{userInfo.name || "Your Name"}</h1>
              <div className="flex flex-wrap gap-4 text-indigo-100 text-sm">
                {userInfo.email && (
                  <span className="flex items-center gap-1">
                    <span>✉</span> {userInfo.email}
                  </span>
                )}
                {userInfo.phone && (
                  <span className="flex items-center gap-1">
                    <span>📞</span> {userInfo.phone}
                  </span>
                )}
                {userInfo.address && (
                  <span className="flex items-center gap-1">
                    <span>📍</span> {userInfo.address}
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-4">
                {userInfo.linkedin && (
                  <a
                    href={userInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {userInfo.github && (
                  <a
                    href={userInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Content Area */}
        <div className="p-8">
          {sortedSections.map((section) => {
            switch (section.type) {
              case "education":
                return renderModernEducation(section);
              case "experience":
                return renderModernExperience(section);
              case "skills":
                return renderModernSkills(section);
              case "projects":
                return renderModernProjects(section);
              case "achievements":
                return renderModernAchievements(section);
              default:
                return null;
            }
          })}
        </div>
      </div>
    );
  }

  // Classic Theme Layout (original)
  return (
    <div
      id="resume-preview"
      className="bg-white text-gray-900 p-8 rounded-lg shadow-lg min-h-[800px]"
      style={{ maxWidth: "8.5in", margin: "0 auto" }}
    >
      {/* Classic Header */}
      <div className="text-center mb-8 pb-4 border-b-2">
        <h1 className="text-3xl font-bold mb-2">{userInfo.name || "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {userInfo.email && <span>{userInfo.email}</span>}
          {userInfo.phone && <span>{userInfo.phone}</span>}
          {userInfo.address && <span>{userInfo.address}</span>}
          {userInfo.linkedin && (
            <a href={userInfo.linkedin} target="_blank" rel="noopener noreferrer" className="underline">
              LinkedIn
            </a>
          )}
          {userInfo.github && (
            <a href={userInfo.github} target="_blank" rel="noopener noreferrer" className="underline">
              GitHub
            </a>
          )}
        </div>
      </div>

      {/* Classic Sections */}
      <div>
        {sortedSections.map((section) => renderClassicSection(section))}
      </div>
    </div>
  );
};

export default ResumePreview;

