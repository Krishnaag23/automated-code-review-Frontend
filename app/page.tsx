"use client";
import React, { useState, useCallback, memo } from "react";
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const requiredFields = [
  "owner",
  "repo",
  "repo_id",
  "pr_id",
  "github_token",
  "llm_api_key",
];

// Memoized InputField component so that it only re-renders when its props change
const InputField = memo(
  ({
    label,
    name,
    type = "text",
    placeholder,
    icon: Icon,
    value,
    error,
    onChange,
    onBlur,
  }: {
    label: string;
    name: string;
    type?: string;
    placeholder: string;
    icon: React.ElementType;
    value: string;
    error: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
  }) => {
    const isRequired = requiredFields.includes(name);
    return (
      <div className="space-y-1">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-500" />
            {label} {isRequired && <span className="text-red-500">*</span>}
          </div>
        </label>
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-required={isRequired}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`mt-1 block w-full rounded-md px-3 py-2 border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 ${
            error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        {error && (
          <p
            id={`${name}-error`}
            role="alert"
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
InputField.displayName = "InputField";

const AISuggestions = memo(({ suggestions }: { suggestions: string[] }) => {
  const formatSuggestion = (suggestion: string) => {
    const parts = suggestion.split("8. Suggested Improvements:");

    if (parts.length === 2) {
      // If "8. Suggested Improvements:" is found, split and format accordingly
      return (
        <>
          <ReactMarkdown
            className="prose prose-blue max-w-none text-gray-700 prose-headings:text-blue-800 prose-a:text-blue-600 prose-strong:text-blue-700"
            remarkPlugins={[remarkGfm]}
          >
            {parts[0] + "8. Suggested Improvements:"}
          </ReactMarkdown>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <pre className="language-javascript">
              <code className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {parts[1].trim()}
              </code>
            </pre>
          </div>
        </>
      );
    }

    // If no "8. Suggested Improvements:" found, render normally
    return (
      <ReactMarkdown
        className="prose prose-blue max-w-none text-gray-700 prose-headings:text-blue-800 prose-a:text-blue-600 prose-strong:text-blue-700 prose-code:text-blue-800 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
        remarkPlugins={[remarkGfm]}
      >
        {suggestion}
      </ReactMarkdown>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
        <MessageSquare className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          AI Analysis &amp; Suggestions
        </h2>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg border border-blue-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
          >
            {formatSuggestion(suggestion)}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-blue-100">
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Zap className="w-4 h-4" />
          <span>Powered by Advanced AI Analysis</span>
        </div>
      </div>
    </div>
  );
});

AISuggestions.displayName = "AISuggestions";

const ComplexityBadge = memo(({ score }: { score: number }) => {
  const getComplexityColor = (score: number) => {
    if (score === 0) return "bg-green-50 text-green-800 border-green-200";
    if (score < 5) return "bg-yellow-50 text-yellow-800 border-yellow-200";
    return "bg-red-50 text-red-800 border-red-200";
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
        <p className="text-2xl font-bold">{score === 0 ? "Optimal" : score}</p>
      </div>
    </div>
  );
});
ComplexityBadge.displayName = "ComplexityBadge";

const IssueCard = memo(({ issue }: { issue: Issue }) => (
  <div
    className={`p-4 rounded-lg border ${
      {
        security: "bg-red-100 text-red-800 border-red-200",
        lint: "bg-yellow-100 text-yellow-800 border-yellow-200",
        codesmell: "bg-purple-100 text-purple-800 border-purple-200",
      }[issue.type] || "bg-gray-100 text-gray-800 border-gray-200"
    } transition-all hover:shadow-md`}
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
));
IssueCard.displayName = "IssueCard";

// Separate the review results into its own memoized component so that
// it does not re-render on every keystroke in the form.
const ReviewResults = memo(
  ({
    response,
    error,
  }: {
    response: CodeReviewResponse | null;
    error: string | null;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit max-h-[800px] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-6">Review Results</h2>
      {error && (
        <div
          className="flex items-center gap-2 text-red-600 mb-4 p-4 bg-red-50 rounded-lg border border-red-200"
          role="alert"
          aria-live="assertive"
        >
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
  )
);
ReviewResults.displayName = "ReviewResults";

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

  // Memoize the change and blur handlers so that they do not get re-created on each render.
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    []
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }, []);

  const validateField = useCallback((name: string, value: string) => {
    if (requiredFields.includes(name) && !value.trim()) {
      return `${name.replace(/_/g, " ").toUpperCase()} is required`;
    }
    return "";
  }, []);

  // Memoize error checking for each field
  const getFieldError = useCallback(
    (fieldName: string) =>
      touched[fieldName]
        ? validateField(fieldName, formData[fieldName as keyof typeof formData])
        : "",
    [touched, formData, validateField]
  );

  const getFormErrors = useCallback(
    (data: typeof formData) =>
      Object.keys(data).reduce((errors: Record<string, string>, key) => {
        const err = validateField(key, data[key as keyof typeof data]);
        if (err) errors[key] = err;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Automated Code Review
              </h1>
              <p className="text-blue-600 font-medium">
                Powered by AI &amp; Static Analysis
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
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Repository Owner"
                  name="owner"
                  placeholder="e.g., krishnaag23"
                  icon={GitBranch}
                  value={formData.owner}
                  error={getFieldError("owner")}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                <InputField
                  label="Repository Name"
                  name="repo"
                  placeholder="e.g., automated-code-review-woa"
                  icon={GitBranch}
                  value={formData.repo}
                  error={getFieldError("repo")}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Repository ID"
                  name="repo_id"
                  placeholder="e.g., 1"
                  icon={GitPullRequest}
                  value={formData.repo_id}
                  error={getFieldError("repo_id")}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                <InputField
                  label="PR ID"
                  name="pr_id"
                  placeholder="e.g., 1"
                  icon={GitPullRequest}
                  value={formData.pr_id}
                  error={getFieldError("pr_id")}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
              </div>
              <div className="space-y-4">
                <InputField
                  label="GitHub Token"
                  name="github_token"
                  type="password"
                  placeholder="Enter your GitHub token"
                  icon={Key}
                  value={formData.github_token}
                  error={getFieldError("github_token")}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                <InputField
                  label="LLM API Key"
                  name="llm_api_key"
                  type="password"
                  placeholder="Enter your LLM API key"
                  icon={Key}
                  value={formData.llm_api_key}
                  error={getFieldError("llm_api_key")}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <Activity className="w-5 h-5 animate-spin" />
                    Analyzing Code...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit for Review
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <ReviewResults response={response} error={error} />
        </div>
      </div>
    </div>
  );
};

export default CodeReviewInterface;
