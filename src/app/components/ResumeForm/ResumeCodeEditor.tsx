"use client";
import { useState, useEffect, useRef } from "react";
import YAML from "yaml";
import { useAppDispatch, useAppSelector } from "lib/redux/hooks";
import { selectResume, setResume } from "lib/redux/resumeSlice";
import type { Resume } from "lib/redux/types";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export const ResumeCodeEditor = () => {
  const resume = useAppSelector(selectResume);
  const dispatch = useAppDispatch();

  const [yamlContent, setYamlContent] = useState(() => YAML.stringify(resume));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync from Redux when resume changes externally (e.g. initial load)
  useEffect(() => {
    try {
      const currentParsed = YAML.parse(yamlContent);
      if (JSON.stringify(currentParsed) !== JSON.stringify(resume)) {
        setYamlContent(YAML.stringify(resume));
        setError(null);
      }
    } catch {
      // Keep user's unparsed text
    }
  }, [resume]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const handleReset = () => {
    const refreshed = YAML.stringify(resume);
    setYamlContent(refreshed);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setYamlContent(newText);

    try {
      const parsed = YAML.parse(newText);
      if (parsed && typeof parsed === "object") {
        // Defensive normalization to ensure the state remains completely valid
        const normalizedResume: Resume = {
          profile: {
            name: parsed.profile?.name || "",
            summary: parsed.profile?.summary || "",
            email: parsed.profile?.email || "",
            phone: parsed.profile?.phone || "",
            location: parsed.profile?.location || "",
            url: parsed.profile?.url || "",
            customField: parsed.profile?.customField || "",
          },
          workExperiences: Array.isArray(parsed.workExperiences)
            ? parsed.workExperiences.map((w: any) => ({
                company: w.company || "",
                jobTitle: w.jobTitle || "",
                date: w.date || "",
                descriptions: Array.isArray(w.descriptions)
                  ? w.descriptions.map(String)
                  : [],
              }))
            : [],
          educations: Array.isArray(parsed.educations)
            ? parsed.educations.map((e: any) => ({
                school: e.school || "",
                degree: e.degree || "",
                date: e.date || "",
                gpa: e.gpa || "",
                descriptions: Array.isArray(e.descriptions)
                  ? e.descriptions.map(String)
                  : [],
              }))
            : [],
          projects: Array.isArray(parsed.projects)
            ? parsed.projects.map((p: any) => ({
                project: p.project || "",
                date: p.date || "",
                descriptions: Array.isArray(p.descriptions)
                  ? p.descriptions.map(String)
                  : [],
              }))
            : [],
          skills: {
            featuredSkills: Array.isArray(parsed.skills?.featuredSkills)
              ? parsed.skills.featuredSkills.map((f: any) => ({
                  skill: f.skill || "",
                  rating: typeof f.rating === "number" ? f.rating : 4,
                }))
              : [],
            descriptions: Array.isArray(parsed.skills?.descriptions)
              ? parsed.skills.descriptions.map(String)
              : [],
          },
          custom: {
            descriptions: Array.isArray(parsed.custom?.descriptions)
              ? parsed.custom.descriptions.map(String)
              : [],
          },
        };

        dispatch(setResume(normalizedResume));
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || "Invalid YAML syntax");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Support Tab key indentation (inserts 2 spaces)
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const updated =
        textarea.value.substring(0, start) +
        "  " +
        textarea.value.substring(end);

      setYamlContent(updated);
      try {
        const parsed = YAML.parse(updated);
        if (parsed && typeof parsed === "object") {
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || "Invalid YAML syntax");
      }

      requestAnimationFrame(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            YAML Resume Editor
          </h2>
          <p className="text-xs text-gray-500">
            Edit your CV directly or paste changes from an LLM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            title="Reset to current saved resume"
          >
            <ArrowPathIcon className="h-3.5 w-3.5 text-gray-500" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 font-mono break-all">{error}</div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Synced with live preview
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={yamlContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="h-[calc(100vh-210px)] min-h-[640px] w-full resize-y rounded-lg border border-gray-800 bg-gray-900 p-4 font-mono text-xs leading-5 text-gray-100 shadow-inner outline-none focus:ring-2 focus:ring-sky-500 selection:bg-sky-500 selection:text-white scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
          placeholder="Paste or write your resume YAML here..."
        />
      </div>
    </div>
  );
};
