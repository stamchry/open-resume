"use client";
import { useState } from "react";
import {
  useAppSelector,
  useSaveStateToLocalStorageOnChange,
  useSetInitialStore,
} from "lib/redux/hooks";
import { ShowForm, selectFormsOrder } from "lib/redux/settingsSlice";
import { ProfileForm } from "components/ResumeForm/ProfileForm";
import { WorkExperiencesForm } from "components/ResumeForm/WorkExperiencesForm";
import { EducationsForm } from "components/ResumeForm/EducationsForm";
import { ProjectsForm } from "components/ResumeForm/ProjectsForm";
import { SkillsForm } from "components/ResumeForm/SkillsForm";
import { ThemeForm } from "components/ResumeForm/ThemeForm";
import { CustomForm } from "components/ResumeForm/CustomForm";
import { ResumeCodeEditor } from "components/ResumeForm/ResumeCodeEditor";
import { ResumeManagerBar } from "components/ResumeForm/ResumeManagerBar";
import { DocumentTextIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import { cx } from "lib/cx";

const formTypeToComponent: { [type in ShowForm]: () => JSX.Element } = {
  workExperiences: WorkExperiencesForm,
  educations: EducationsForm,
  projects: ProjectsForm,
  skills: SkillsForm,
  custom: CustomForm,
};

export const ResumeForm = () => {
  useSetInitialStore();
  useSaveStateToLocalStorageOnChange();

  const formsOrder = useAppSelector(selectFormsOrder);
  const [isHover, setIsHover] = useState(false);
  const [editorMode, setEditorMode] = useState<"form" | "code">("form");

  return (
    <div
      className={cx(
        "flex justify-center scrollbar-thin scrollbar-track-gray-100 md:h-[calc(100vh-var(--top-nav-bar-height))] md:justify-end md:overflow-y-scroll",
        isHover ? "scrollbar-thumb-gray-200" : "scrollbar-thumb-gray-100"
      )}
      onMouseOver={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <section
        className={cx(
          "flex w-full flex-col gap-6 p-[var(--resume-padding)] transition-all",
          editorMode === "code" ? "max-w-3xl" : "max-w-2xl"
        )}
      >
        <ResumeManagerBar />

        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setEditorMode("form")}
              className={cx(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                editorMode === "form"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <DocumentTextIcon className="h-4 w-4" />
              Form View
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("code")}
              className={cx(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                editorMode === "code"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <CodeBracketIcon className="h-4 w-4" />
              Code View (YAML)
            </button>
          </div>
        </div>

        {editorMode === "form" ? (
          <>
            <ProfileForm />
            {formsOrder.map((form) => {
              const Component = formTypeToComponent[form];
              return <Component key={form} />;
            })}
            <ThemeForm />
          </>
        ) : (
          <ResumeCodeEditor />
        )}
        <br />
      </section>
      <FlexboxSpacer maxWidth={50} className="hidden md:block" />
    </div>
  );
};
