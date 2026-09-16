import type { RootState } from "lib/redux/store";
import type { Resume } from "lib/redux/types";
import { initialResumeState } from "lib/redux/resumeSlice";
import { initialSettings, type Settings } from "lib/redux/settingsSlice";

export interface ResumeProfileItem {
  id: string;
  name: string;
  updatedAt: number;
  resume: Resume;
  settings: Settings;
}

export interface MultiResumeStorage {
  activeResumeId: string;
  resumes: ResumeProfileItem[];
}

const LOCAL_STORAGE_KEY = "open-resume-state";
const MULTI_RESUME_STORAGE_KEY = "open-resume-profiles";

export const getMultiResumeStorage = (): MultiResumeStorage => {
  if (typeof window === "undefined") {
    return { activeResumeId: "", resumes: [] };
  }

  try {
    const raw = localStorage.getItem(MULTI_RESUME_STORAGE_KEY);
    if (raw) {
      const parsed: MultiResumeStorage = JSON.parse(raw);
      if (parsed.resumes && parsed.resumes.length > 0) {
        const exists = parsed.resumes.some(
          (r) => r.id === parsed.activeResumeId
        );
        if (!exists) {
          parsed.activeResumeId = parsed.resumes[0].id;
        }
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }

  // Backwards compatibility: migrate existing single-resume storage
  try {
    const oldRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (oldRaw) {
      const oldState: RootState = JSON.parse(oldRaw);
      if (oldState.resume) {
        const candidateName = oldState.resume.profile?.name
          ? `${oldState.resume.profile.name}'s Resume`
          : "My Resume";
        const initialItem: ResumeProfileItem = {
          id: "default",
          name: candidateName,
          updatedAt: Date.now(),
          resume: oldState.resume,
          settings: oldState.settings || initialSettings,
        };
        const initialStorage: MultiResumeStorage = {
          activeResumeId: "default",
          resumes: [initialItem],
        };
        saveMultiResumeStorage(initialStorage);
        return initialStorage;
      }
    }
  } catch (e) {
    // Ignore
  }

  // Default empty initial storage with one clean resume
  const defaultItem: ResumeProfileItem = {
    id: "default",
    name: "My Resume",
    updatedAt: Date.now(),
    resume: initialResumeState,
    settings: initialSettings,
  };
  const fallbackStorage: MultiResumeStorage = {
    activeResumeId: "default",
    resumes: [defaultItem],
  };
  saveMultiResumeStorage(fallbackStorage);
  return fallbackStorage;
};

export const saveMultiResumeStorage = (storage: MultiResumeStorage) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MULTI_RESUME_STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    // Ignore
  }
};

export const loadStateFromLocalStorage = (): RootState | undefined => {
  if (typeof window === "undefined") return undefined;

  const storage = getMultiResumeStorage();
  if (storage.resumes.length > 0) {
    const active =
      storage.resumes.find((r) => r.id === storage.activeResumeId) ||
      storage.resumes[0];
    return {
      resume: active.resume,
      settings: active.settings,
    };
  }

  try {
    const stringifiedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stringifiedState) return undefined;
    return JSON.parse(stringifiedState);
  } catch (e) {
    return undefined;
  }
};

export const saveStateToLocalStorage = (state: RootState) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));

    const storage = getMultiResumeStorage();
    if (storage.resumes.length === 0) {
      const candidateName = state.resume?.profile?.name
        ? `${state.resume.profile.name}'s Resume`
        : "My Resume";
      storage.activeResumeId = "default";
      storage.resumes = [
        {
          id: "default",
          name: candidateName,
          updatedAt: Date.now(),
          resume: state.resume,
          settings: state.settings,
        },
      ];
      saveMultiResumeStorage(storage);
      return;
    }

    const activeIndex = storage.resumes.findIndex(
      (r) => r.id === storage.activeResumeId
    );
    if (activeIndex !== -1) {
      storage.resumes[activeIndex].resume = state.resume;
      storage.resumes[activeIndex].settings = state.settings;
      storage.resumes[activeIndex].updatedAt = Date.now();
      saveMultiResumeStorage(storage);
    }
  } catch (e) {
    // Ignore
  }
};

export const getHasUsedAppBefore = () => {
  if (typeof window === "undefined") return false;
  return Boolean(
    localStorage.getItem(MULTI_RESUME_STORAGE_KEY) ||
      localStorage.getItem(LOCAL_STORAGE_KEY)
  );
};

export const switchActiveResume = (
  id: string
): ResumeProfileItem | undefined => {
  const storage = getMultiResumeStorage();
  const target = storage.resumes.find((r) => r.id === id);
  if (!target) return undefined;

  storage.activeResumeId = id;
  saveMultiResumeStorage(storage);
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({ resume: target.resume, settings: target.settings })
  );
  return target;
};

export const createNewResume = (
  name: string,
  baseResume?: Resume,
  baseSettings?: Settings
): ResumeProfileItem => {
  const storage = getMultiResumeStorage();
  const newId = `resume-${Date.now()}`;
  const newItem: ResumeProfileItem = {
    id: newId,
    name: name.trim() || "Untitled Resume",
    updatedAt: Date.now(),
    resume: baseResume
      ? JSON.parse(JSON.stringify(baseResume))
      : initialResumeState,
    settings: baseSettings
      ? JSON.parse(JSON.stringify(baseSettings))
      : initialSettings,
  };

  storage.resumes.push(newItem);
  storage.activeResumeId = newId;
  saveMultiResumeStorage(storage);
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({ resume: newItem.resume, settings: newItem.settings })
  );
  return newItem;
};

export const duplicateCurrentResume = (
  currentResume: Resume,
  currentSettings: Settings,
  currentName: string
): ResumeProfileItem => {
  const copyName = `${currentName} (Copy)`;
  return createNewResume(copyName, currentResume, currentSettings);
};

export const renameResumeItem = (id: string, newName: string) => {
  const storage = getMultiResumeStorage();
  const target = storage.resumes.find((r) => r.id === id);
  if (target) {
    target.name = newName.trim() || "Untitled Resume";
    target.updatedAt = Date.now();
    saveMultiResumeStorage(storage);
  }
};

export const deleteResumeItem = (
  id: string
): { remainingResumes: ResumeProfileItem[]; newActive?: ResumeProfileItem } => {
  const storage = getMultiResumeStorage();
  if (storage.resumes.length <= 1) {
    return { remainingResumes: storage.resumes };
  }

  const filtered = storage.resumes.filter((r) => r.id !== id);
  let newActive: ResumeProfileItem | undefined;

  if (storage.activeResumeId === id) {
    newActive = filtered[0];
    storage.activeResumeId = newActive.id;
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ resume: newActive.resume, settings: newActive.settings })
    );
  }

  storage.resumes = filtered;
  saveMultiResumeStorage(storage);
  return { remainingResumes: filtered, newActive };
};
