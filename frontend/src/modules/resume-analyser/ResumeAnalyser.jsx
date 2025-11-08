import React, { useState } from "react";
import api from "../../services/api";

const ResumeAnalyser = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [fileName, setFileName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState("item-1");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        return;
      }
      setResumeFile(file);
      setFileName(file.name);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setAnalysisResult(null);

    if (!resumeFile) {
      setError("Please upload a resume file.");
      return;
    }

    if (!jobRole || jobRole.length < 3) {
      setError("Job role must be at least 3 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("resumeContent", resumeFile);
      formData.append("jobRole", jobRole);

      const response = await api.post("/student/resume/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setAnalysisResult(response.data);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err.response?.data?.error ||
          "An unexpected error occurred during analysis. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ScoreIndicator = ({ score, scoreRationale }) => (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-blue-600"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{score}</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-lg font-semibold">Resume Score</p>
        <p className="text-sm text-gray-600">{scoreRationale}</p>
      </div>
    </div>
  );

  const AccordionItem = ({ value, icon, title, children }) => {
    const isOpen = activeAccordion === value;
    return (
      <div className="border-b border-gray-200">
        <button
          onClick={() => setActiveAccordion(isOpen ? null : value)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-100">
              {icon}
            </div>
            <span className="text-lg font-medium">{title}</span>
          </div>
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isOpen && (
          <div className="px-4 pb-4 text-base text-gray-700">{children}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Resume Analyser</h1>
          <p className="text-gray-600 mt-1">
            Upload your resume and get AI-powered feedback for your target job role
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Form */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Analysis Form</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume (PDF only, max 5MB)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex flex-col items-center justify-center w-full h-32 px-4 text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {fileName ? (
                        <>
                          <svg
                            className="h-8 w-8 mb-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-medium">{fileName}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-8 w-8 mb-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            Click or drag to upload your resume
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Job Role Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Job Role
                  </label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g., Senior Product Manager"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Analyze Resume
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="min-h-[50vh]">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-2">Analysis Report</h2>
                <p className="text-gray-600 mb-6">
                  Here's how your resume stacks up against the role.
                </p>

                <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                  <AccordionItem
                    value="item-1"
                    icon={
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                    title="Resume Score"
                  >
                    <div className="pt-4">
                      <ScoreIndicator
                        score={analysisResult.resumeScore}
                        scoreRationale={analysisResult.scoreRationale}
                      />
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    value="item-2"
                    icon={
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    }
                    title="Key Information"
                  >
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResult.importantInfo?.map((info, index) => (
                        <li key={index}>{info}</li>
                      ))}
                    </ul>
                  </AccordionItem>

                  <AccordionItem
                    value="item-3"
                    icon={
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    }
                    title="Overall Suitability"
                  >
                    <p>{analysisResult.overallSuitability}</p>
                  </AccordionItem>

                  <AccordionItem
                    value="item-4"
                    icon={
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                        />
                      </svg>
                    }
                    title="Skills Gap Analysis"
                  >
                    <p>{analysisResult.skillsGapAnalysis}</p>
                  </AccordionItem>

                  <AccordionItem
                    value="item-5"
                    icon={
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    }
                    title="Improvement Suggestions"
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {analysisResult.improvementSuggestions?.map(
                        (suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        )
                      )}
                    </ul>
                  </AccordionItem>

                  <AccordionItem
                    value="item-6"
                    icon={
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    }
                    title="Actionable Feedback"
                  >
                    <p>{analysisResult.feedback}</p>
                  </AccordionItem>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 flex h-full min-h-[300px] items-center justify-center border-dashed border-gray-300">
                <div className="text-center p-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold">
                    Your analysis will appear here
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Fill out the form and let our AI provide you with
                    personalized feedback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyser;

