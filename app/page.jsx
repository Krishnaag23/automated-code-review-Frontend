"use client";
import React, { useState } from "react";
import {
  AlertCircle,
  Code2,
  Send,
  Activity,
  BarChart2,
  File,
  MessageSquare,
} from "lucide-react";

const CodeReviewInterface = () => {
  // Previous state declarations remain the same
  const [formData, setFormData] = useState({
    owner: "",
    repo: "",
    repo_id: "",
    pr_id: "",
    language: "JavaScript",
    github_token: "",
    llm_api_key: "",
  });

  const [touched, setTouched] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Previous validation and handlers remain the same
  const validateField = (name, value) => {
    if (
      [
        "owner",
        "repo",
        "repo_id",
        "pr_id",
        "github_token",
        "llm_api_key",
      ].includes(name)
    ) {
      return !value.trim()
        ? `${name.replace("_", " ").toUpperCase()} is required`
        : "";
    }
    return "";
  };

  const getFormErrors = (data) => {
    return Object.keys(data).reduce((errors, key) => {
      const error = validateField(key, data[key]);
      if (error) errors[key] = error;
      return errors;
    }, {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = getFormErrors(formData);

    setTouched(
      Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    if (Object.keys(errors).length > 0) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://automated-code-review-woa.onrender.com/review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(
        "Failed to fetch. Please check your inputs and try again. " +
          err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const getFieldError = (fieldName) =>
    touched[fieldName] ? validateField(fieldName, formData[fieldName]) : "";

  const InputField = ({ label, name, type = "text", placeholder }) => {
    const error = getFieldError(name);
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {label} <span className="text-red-500">*</span>
        </label>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={`mt-1 block w-full rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? "border-red-300 bg-red-50" : "border-gray-300"
          }`}
          placeholder={placeholder}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  const getIssueColor = (type) => {
    switch (type) {
      case "security":
        return "bg-red-100 text-red-800";
      case "lint":
        return "bg-yellow-100 text-yellow-800";
      case "codesmell":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const IssueCard = ({ issue }) => (
    <div className={`p-4 rounded-md border ${getIssueColor(issue.type)}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="font-semibold capitalize">{issue.type}:</span>{" "}
          {issue.message}
        </div>
        {issue.line && (
          <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">
            Line {issue.line}
          </span>
        )}
      </div>
    </div>
  );

  const AISuggestions = ({ suggestions }) => (
    <div className="space-y-4 mt-6 bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        AI Suggestions
      </h3>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="text-gray-700">
            {suggestion.startsWith("**") ? (
              <h4 className="font-semibold text-gray-900 mt-2">
                {suggestion.replace(/\*\*/g, "")}
              </h4>
            ) : (
              <p className="ml-4">{suggestion}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 bg-white p-4 rounded-lg shadow-sm">
          <Code2 className="w-10 h-10 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Automated Code Review
            </h1>
            <p className="text-gray-600">
              Analyze your code with AI-powered insights
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Review Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Repository Owner"
                  name="owner"
                  placeholder="e.g., krishnaag23"
                />
                <InputField
                  label="Repository Name"
                  name="repo"
                  placeholder="e.g., automated-code-review-woa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Repository ID"
                  name="repo_id"
                  placeholder="e.g., 1"
                />
                <InputField label="PR ID" name="pr_id" placeholder="e.g., 1" />
              </div>
              <InputField
                label="GitHub Token"
                name="github_token"
                type="password"
                placeholder="Enter your GitHub token"
              />
              <InputField
                label="LLM API Key"
                name="llm_api_key"
                type="password"
                placeholder="Enter your LLM API key"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {loading ? "Analyzing Code..." : "Submit for Review"}
              </button>
            </form>
          </div>

          {/* Response Display */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-h-[800px] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Review Results</h2>

            {error && (
              <div className="flex items-center gap-2 text-red-600 mb-4 p-4 bg-red-50 rounded-md">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            {response && (
              <div className="space-y-4">
                {/* File Information */}
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-md">
                  <File className="w-5 h-5 text-gray-600" />
                  <p className="font-medium">File: {response.file}</p>
                </div>

                {/* Complexity Score */}
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-md">
                  <BarChart2 className="w-6 h-6 text-blue-600" />
                  <p className="text-xl font-bold text-blue-700">
                    Complexity Score: {response.complexity}
                  </p>
                </div>

                {/* Issues */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Issues Found</h3>
                  {response.issues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </div>

                {/* AI Suggestions */}
                {response.aiSuggestions && (
                  <AISuggestions suggestions={response.aiSuggestions} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeReviewInterface;