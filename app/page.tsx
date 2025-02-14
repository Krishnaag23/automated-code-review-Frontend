"use client";
import React, { useState, useCallback } from "react";
import {
  AlertCircle,
  Send,
  Activity,
  BarChart2,
  File,
  MessageSquare,
  Zap,
  GitBranch,
  GitPullRequest,
  Key,
} from "lucide-react";

type Issue = {
  type: "lint" | "security" | "codesmell";
  message: string;
  line?: number;
};

type CodeReviewResponse = {
  file: string;
  issues: Issue[];
  complexity: number;
  aiSuggestions?: string[];
};

const CodeReviewInterface = () => {
  const [formData, setFormData] = useState({
    owner: "",
    repo: "",
    repo_id: "",
    pr_id: "",
    language: "JavaScript",
    github_token: "",
    llm_api_key: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [response, setResponse] = useState<CodeReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredFields = [
    "owner",
    "repo",
    "repo_id",
    "pr_id",
    "github_token",
    "llm_api_key",
  ];

  const validateField = useCallback(
    (name: string, value: string) => {
      if (requiredFields.includes(name) && !value.trim()) {
        return `${name.replace(/_/g, " ").toUpperCase()} is required`;
      }
      return "";
    },
    [requiredFields]
  );

  const getFormErrors = useCallback(
    (data: typeof formData) =>
      Object.keys(data).reduce((errors: Record<string, string>, key) => {
        const error = validateField(key, data[key as keyof typeof data]);
        if (error) errors[key] = error;
        return errors;
      }, {}),
    [validateField]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = getFormErrors(formData);

    setTouched(
      Object.keys(formData).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as typeof touched
      )
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

      const data: CodeReviewResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to fetch: ${err.message}`
          : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const getFieldError = (fieldName: string) =>
    touched[fieldName]
      ? validateField(fieldName, formData[fieldName as keyof typeof formData])
      : "";

  const InputField = ({
    label,
    name,
    type = "text",
    placeholder,
    icon: Icon,
  }: {
    label: string;
    name: string;
    type?: string;
    placeholder: string;
    icon: React.ElementType;
  }) => {
    const error = getFieldError(name);
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-500" />
            {label} <span className="text-red-500">*</span>
          </div>
        </label>
        <input
          type={type}
          name={name}
          value={formData[name as keyof typeof formData]}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={`mt-1 block w-full rounded-md px-3 py-2 border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
          }`}
          placeholder={placeholder}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const getIssueColor = (type: Issue["type"]) => {
    const colors = {
      security: "bg-red-100 text-red-800 border-red-200",
      lint: "bg-yellow-100 text-yellow-800 border-yellow-200",
      codesmell: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const IssueCard = ({ issue }: { issue: Issue }) => (
    <div
      className={`p-4 rounded-lg border ${getIssueColor(
        issue.type
      )} transition-all hover:shadow-md`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-opacity-50 uppercase">
              {issue.type}
            </span>
          </div>
          <p className="text-sm">{issue.message}</p>
        </div>
        {issue.line && (
          <div className="flex-shrink-0">
            <span className="text-xs font-mono bg-opacity-50 px-2 py-1 rounded">
              Line {issue.line}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // const parseMarkdownLikeText = (text: string) => {
  //   if (text.startsWith("##")) {
  //     const level = text.match(/^#{2,}/)?.[0].length || 2;
  //     const content = text.replace(/^#{2,}\s*/, "");
  //     return {
  //       type: "heading",
  //       level,
  //       content,
  //     };
  //   } else if (text.match(/^\s*-\s+/)) {
  //     const indent = text.match(/^\s*/)?.[0].length || 0;
  //     const content = text.replace(/^\s*-\s+/, "");
  //     return {
  //       type: "list-item",
  //       indent: Math.floor(indent / 2),
  //       content,
  //     };
  //   }
  //   return { type: "text", content: text };
  // };

  const AISuggestions = ({ suggestions }: { suggestions: string[] }) => {
    const parseSuggestion = (suggestion: string) => {
      if (suggestion.startsWith("## ")) {
        return {
          type: "header",
          level: 2,
          content: suggestion.replace("## ", ""),
        };
      }
      if (suggestion.startsWith("### ")) {
        return {
          type: "header",
          level: 3,
          content: suggestion.replace("### ", ""),
        };
      }
      if (suggestion.startsWith("* ")) {
        return { type: "bullet", content: suggestion.replace("* ", "") };
      }
      if (suggestion.startsWith("```")) {
        return { type: "code-block", content: suggestion };
      }
      return { type: "text", content: suggestion };
    };

    const renderSuggestion = (parsed: {
      type: string;
      level?: number;
      content: string;
    }) => {
      switch (parsed.type) {
        case "header":
          if (parsed.level === 2) {
            return <h2 className="text-lg font-bold mt-4">{parsed.content}</h2>;
          }
          if (parsed.level === 3) {
            return (
              <h3 className="text-md font-semibold mt-3 text-gray-800">
                {parsed.content}
              </h3>
            );
          }
          break;
        case "bullet":
          return (
            <li className="list-disc list-inside text-gray-700">
              {parsed.content}
            </li>
          );
        case "code-block":
          return (
            <pre className="bg-gray-800 text-gray-100 text-sm p-4 rounded-lg overflow-x-auto mt-4">
              <code>{parsed.content.replace(/```/g, "").trim()}</code>
            </pre>
          );
        case "text":
          return <p className="text-gray-700 mt-2">{parsed.content}</p>;
        default:
          return null;
      }
    };

    // Track multi-line code blocks
    let isCodeBlock = false;
    let codeLines: string[] = [];
    const formattedSuggestions = [];

    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      if (suggestion.startsWith("```")) {
        if (!isCodeBlock) {
          isCodeBlock = true;
          codeLines = [suggestion];
        } else {
          isCodeBlock = false;
          codeLines.push(suggestion);
          formattedSuggestions.push({
            type: "code-block",
            content: codeLines.join("\n"),
          });
          codeLines = [];
        }
      } else if (isCodeBlock) {
        codeLines.push(suggestion);
      } else {
        formattedSuggestions.push(parseSuggestion(suggestion));
      }
    }

    return (
      <div className="bg-black p-6 rounded-lg border border-blue-100 space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-900">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          AI Analysis & Suggestions
        </h3>
        {formattedSuggestions.map((parsed, index) => (
          <React.Fragment key={index}>
            {renderSuggestion(parsed)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const ComplexityBadge = ({ score }: { score: number }) => {
    const getComplexityColor = (score: number) => {
      if (score === 0) return "bg-green-100 text-green-800 border-green-200";
      if (score < 5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
      return "bg-red-100 text-red-800 border-red-200";
    };

    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border ${getComplexityColor(
          score
        )}`}
      >
        <BarChart2 className="w-6 h-6" />
        <div>
          <p className="text-sm font-medium">Complexity Score</p>
          <p className="text-2xl font-bold">
            {score === 0 ? "Optimal" : score}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header section remains the same */}
        <div className="flex flex-col gap-2 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Automated Code Review
              </h1>
              <p className="text-blue-600 font-medium">
                Powered by AI & Static Analysis
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-black" />
              Review Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Repository Owner"
                  name="owner"
                  placeholder="e.g., krishnaag23"
                  icon={GitBranch}
                />
                <InputField
                  label="Repository Name"
                  name="repo"
                  placeholder="e.g., automated-code-review-woa"
                  icon={GitBranch}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Repository ID"
                  name="repo_id"
                  placeholder="e.g., 1"
                  icon={GitPullRequest}
                />
                <InputField
                  label="PR ID"
                  name="pr_id"
                  placeholder="e.g., 1"
                  icon={GitPullRequest}
                />
              </div>
              <div className="space-y-4">
                <InputField
                  label="GitHub Token"
                  name="github_token"
                  type="password"
                  placeholder="Enter your GitHub token"
                  icon={Key}
                />
                <InputField
                  label="LLM API Key"
                  name="llm_api_key"
                  type="password"
                  placeholder="Enter your LLM API key"
                  icon={Key}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
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

          {/* Results Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit max-h-[800px] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-6">Review Results</h2>

            {error && (
              <div className="flex items-center gap-2 text-red-600 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            {response && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <File className="w-5 h-5 text-gray-600" />
                  <p className="font-medium">{response.file}</p>
                </div>

                <ComplexityBadge score={response.complexity} />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Issues Found ({response.issues.length})
                  </h3>
                  <div className="space-y-3">
                    {response.issues.map((issue, index) => (
                      <IssueCard key={index} issue={issue} />
                    ))}
                  </div>
                </div>

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
