import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import SectionList from "./SectionList";
import ResumePreview from "./ResumePreview";
import ThemeSelector from "./ThemeSelector";
import { getResume, saveResume, createResume } from "./api";
import { useAuth } from "../../context/AuthContext";
import "./styles.css";

const ResumeBuilder = ({ userId: propUserId }) => {
  const { user } = useAuth();
  const userId = propUserId || user?.id || 1;
  const [resumeData, setResumeData] = useState({
    userInfo: {
      name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      linkedin: "",
      github: "",
    },
    sections: [
      { id: "education", type: "education", title: "Education", order: 0, items: [] },
      { id: "experience", type: "experience", title: "Experience", order: 1, items: [] },
      { id: "skills", type: "skills", title: "Skills", order: 2, items: [] },
      { id: "projects", type: "projects", title: "Projects", order: 3, items: [] },
      { id: "achievements", type: "achievements", title: "Achievements", order: 4, items: [] },
    ],
  });
  const [theme, setTheme] = useState("Classic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadResume();
  }, [userId]);

  // Update userInfo when user data becomes available (if not already loaded from resume)
  useEffect(() => {
    if (user && !resumeData.userInfo.email && !loading) {
      setResumeData(prev => ({
        ...prev,
        userInfo: {
          ...prev.userInfo,
          name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : prev.userInfo.name,
          email: user?.email || prev.userInfo.email,
          phone: user?.phone || prev.userInfo.phone,
        }
      }));
    }
  }, [user, loading]);

  const getDefaultResumeData = () => ({
    userInfo: {
      name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      linkedin: "",
      github: "",
    },
    sections: [
      { id: "education", type: "education", title: "Education", order: 0, items: [] },
      { id: "experience", type: "experience", title: "Experience", order: 1, items: [] },
      { id: "skills", type: "skills", title: "Skills", order: 2, items: [] },
      { id: "projects", type: "projects", title: "Projects", order: 3, items: [] },
      { id: "achievements", type: "achievements", title: "Achievements", order: 4, items: [] },
    ],
  });

  const loadResume = async () => {
    try {
      setLoading(true);
      
      // Set timeout for the API call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout - database may not be set up")), 8000)
      );

      try {
        const response = await Promise.race([
          getResume(userId),
          timeoutPromise
        ]);

        if (response.data && response.data.data) {
          const data = typeof response.data.data === "string" 
            ? JSON.parse(response.data.data) 
            : response.data.data;
          
          // Ensure all items have IDs
          const dataWithIds = {
            ...data,
            sections: data.sections?.map((section) => ({
              ...section,
              items: section.items?.map((item, idx) => ({
                ...item,
                id: item.id || `item-${section.id}-${idx}-${Date.now()}`,
              })) || [],
            })) || [],
          };
          
          setResumeData(dataWithIds);
          setTheme(response.data.theme || "Classic");
          setLoading(false);
          return;
        }

        // If no data, try to create a new resume (only if database is available)
        if (!response.data.error) {
          try {
            await Promise.race([
              createResume(userId),
              timeoutPromise
            ]);
            const createResponse = await Promise.race([
              getResume(userId),
              timeoutPromise
            ]);
            
            if (createResponse.data && createResponse.data.data) {
              const data = typeof createResponse.data.data === "string"
                ? JSON.parse(createResponse.data.data)
                : createResponse.data.data;
              
              // Ensure all items have IDs
              const dataWithIds = {
                ...data,
                sections: data.sections?.map((section) => ({
                  ...section,
                  items: section.items?.map((item, idx) => ({
                    ...item,
                    id: item.id || `item-${section.id}-${idx}-${Date.now()}`,
                  })) || [],
                })) || [],
              };
              
              setResumeData(dataWithIds);
              setTheme(createResponse.data.theme || "Classic");
              setLoading(false);
              return;
            }
          } catch (createError) {
            console.log("Could not create resume in database - using default template");
            // Continue to use default template
          }
        }
      } catch (timeoutError) {
        console.log("API timeout - database may not be set up, using default template");
        setMessage("Database not configured. Using default template. Resume will work but won't be saved.");
      }

      // Use default template if no data or on error
      const defaultData = getDefaultResumeData();
      // Ensure default data has proper structure
      setResumeData(defaultData);
      
    } catch (error) {
      console.error("Error loading resume:", error);
      setMessage("Using default template. Set up database to enable saving.");
      setResumeData(getDefaultResumeData());
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveResume({
        userId,
        data: resumeData,
        theme,
      });
      setMessage("Resume saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving resume:", error);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setMessage("Database not configured. Resume cannot be saved. Please set up the database first.");
      } else {
        setMessage("Failed to save resume. " + (error.response?.data?.message || error.message));
      }
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("resume-preview");
    const opt = {
      margin: 0.5,
      filename: `${resumeData.userInfo.name || "My_Resume"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    // Handle section reordering
    if (result.type === "SECTION") {
      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;
      
      if (sourceIndex !== destIndex) {
        const items = Array.from(resumeData.sections);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destIndex, 0, reorderedItem);

        // Update order
        const updatedSections = items.map((section, index) => ({
          ...section,
          order: index,
        }));

        setResumeData({
          ...resumeData,
          sections: updatedSections,
        });
      }
    }
  };

  const handleUpdateUserInfo = (field, value) => {
    setResumeData({
      ...resumeData,
      userInfo: {
        ...resumeData.userInfo,
        [field]: value,
      },
    });
  };

  const handleUpdateSection = (sectionId, itemId, updatedItem) => {
    const updatedSections = resumeData.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? updatedItem : item
          ),
        };
      }
      return section;
    });
    setResumeData({
      ...resumeData,
      sections: updatedSections,
    });
  };

  const handleAddItem = (sectionId, newItem) => {
    // Ensure the new item has a unique ID
    const itemWithId = {
      ...newItem,
      id: newItem.id || `item-${sectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedSections = resumeData.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...(section.items || []), itemWithId],
        };
      }
      return section;
    });
    setResumeData({
      ...resumeData,
      sections: updatedSections,
    });
  };

  const handleDeleteItem = (sectionId, itemId) => {
    const updatedSections = resumeData.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        };
      }
      return section;
    });
    setResumeData({
      ...resumeData,
      sections: updatedSections,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading resume...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Resume Builder</h1>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? "Saving..." : "Save Resume"}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>
          {message && (
            <div className={`mt-2 p-2 rounded ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-4">
  {/* Left Panel - Editor (2/5 width) */}
  <div className="col-span-2 bg-white rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-100px)]">
    <ThemeSelector theme={theme} onThemeChange={setTheme} />

    {/* User Info Form */}
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h2 className="text-lg font-bold mb-3">Personal Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Full Name"
          value={resumeData.userInfo.name}
          onChange={(e) => handleUpdateUserInfo("name", e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="email"
          placeholder="Email"
          value={resumeData.userInfo.email}
          onChange={(e) => handleUpdateUserInfo("email", e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={resumeData.userInfo.phone}
          onChange={(e) => handleUpdateUserInfo("phone", e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Address"
          value={resumeData.userInfo.address}
          onChange={(e) => handleUpdateUserInfo("address", e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="url"
          placeholder="LinkedIn URL"
          value={resumeData.userInfo.linkedin}
          onChange={(e) => handleUpdateUserInfo("linkedin", e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="url"
          placeholder="GitHub URL"
          value={resumeData.userInfo.github}
          onChange={(e) => handleUpdateUserInfo("github", e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
      </div>
    </div>

            {/* Sections */}
            <SectionList
              sections={resumeData.sections}
              onUpdateSection={handleUpdateSection}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
              onDragEnd={handleDragEnd}
            />
  </div>

  {/* Right Panel - Preview (3/5 width) */}
  <div className="col-span-3 bg-white rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-100px)]">
    <h2 className="text-lg font-bold mb-4">Live Preview</h2>
    <div className="bg-gray-100 p-4 rounded-lg">
      <ResumePreview resumeData={resumeData} theme={theme} />
    </div>
  </div>
</div>

      </div>
    </div>
  );
};

export default ResumeBuilder;

