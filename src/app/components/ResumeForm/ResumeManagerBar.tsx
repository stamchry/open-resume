"use client";
import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "lib/redux/hooks";
import { selectResume, setResume } from "lib/redux/resumeSlice";
import { selectSettings, setSettings } from "lib/redux/settingsSlice";
import {
  getMultiResumeStorage,
  switchActiveResume,
  createNewResume,
  duplicateCurrentResume,
  renameResumeItem,
  deleteResumeItem,
  type MultiResumeStorage,
  type ResumeProfileItem,
} from "lib/redux/local-storage";
import {
  ChevronDownIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export const ResumeManagerBar = () => {
  const resume = useAppSelector(selectResume);
  const settings = useAppSelector(selectSettings);
  const dispatch = useAppDispatch();

  const [storage, setStorage] = useState<MultiResumeStorage>(() =>
    getMultiResumeStorage()
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync storage on mount
  useEffect(() => {
    setStorage(getMultiResumeStorage());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen]);

  const activeResume: ResumeProfileItem =
    storage.resumes.find((r) => r.id === storage.activeResumeId) ||
    storage.resumes[0] || {
      id: "default",
      name: "My Resume",
      updatedAt: Date.now(),
      resume,
      settings,
    };

  const handleSwitch = (id: string) => {
    if (id === activeResume.id) {
      setIsDropdownOpen(false);
      return;
    }
    const target = switchActiveResume(id);
    if (target) {
      dispatch(setResume(target.resume));
      dispatch(setSettings(target.settings));
      setStorage(getMultiResumeStorage());
    }
    setIsDropdownOpen(false);
  };

  const handleDuplicate = () => {
    const copy = duplicateCurrentResume(resume, settings, activeResume.name);
    dispatch(setResume(copy.resume));
    dispatch(setSettings(copy.settings));
    setStorage(getMultiResumeStorage());
    setIsDropdownOpen(false);
  };

  const handleOpenRename = () => {
    setRenameValue(activeResume.name);
    setShowRenameModal(true);
    setIsDropdownOpen(false);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (renameValue.trim()) {
      renameResumeItem(activeResume.id, renameValue.trim());
      setStorage(getMultiResumeStorage());
    }
    setShowRenameModal(false);
  };

  const handleOpenNew = () => {
    setNewResumeName("");
    setShowNewModal(true);
    setIsDropdownOpen(false);
  };

  const handleCreateNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const created = createNewResume(newResumeName.trim() || "New Resume");
    dispatch(setResume(created.resume));
    dispatch(setSettings(created.settings));
    setStorage(getMultiResumeStorage());
    setShowNewModal(false);
  };

  const handleDelete = () => {
    if (storage.resumes.length <= 1) return;
    const { newActive } = deleteResumeItem(activeResume.id);
    if (newActive) {
      dispatch(setResume(newActive.resume));
      dispatch(setSettings(newActive.settings));
    }
    setStorage(getMultiResumeStorage());
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
        {/* Left: Active resume selector */}
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            CV:
          </span>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <DocumentTextIcon className="h-4 w-4 text-sky-600 flex-shrink-0" />
            <span className="max-w-[200px] truncate text-left">
              {activeResume.name}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-8 top-full z-40 mt-1.5 w-64 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Your Resumes ({storage.resumes.length})
              </div>
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {storage.resumes.map((item) => {
                  const isSelected = item.id === activeResume.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSwitch(item.id)}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-sky-50 font-semibold text-sky-900"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <DocumentTextIcon
                          className={`h-4 w-4 flex-shrink-0 ${
                            isSelected ? "text-sky-600" : "text-gray-400"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-sky-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={handleOpenNew}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-sky-600 hover:bg-sky-50 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Create New CV
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick actions (Duplicate, Rename, New, Delete) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            title="Duplicate this CV"
          >
            <DocumentDuplicateIcon className="h-3.5 w-3.5 text-gray-500" />
            Duplicate
          </button>

          <button
            type="button"
            onClick={handleOpenRename}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            title="Rename this CV"
          >
            <PencilSquareIcon className="h-3.5 w-3.5 text-gray-500" />
            Rename
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            title="Create a new CV"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New
          </button>

          {storage.resumes.length > 1 && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center rounded-md border border-transparent p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Delete this CV"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-gray-900">Rename CV</h3>
            <p className="mt-1 text-xs text-gray-500">
              Give this resume a descriptive title (e.g. Senior Backend Role).
            </p>
            <form onSubmit={handleSaveRename} className="mt-4">
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
                placeholder="Resume name"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New CV Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-gray-900">
              Create New CV
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Enter a name for your new resume profile.
            </p>
            <form onSubmit={handleCreateNew} className="mt-4">
              <input
                type="text"
                autoFocus
                value={newResumeName}
                onChange={(e) => setNewResumeName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Fullstack Engineer"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-gray-900">
              Delete Resume?
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Are you sure you want to delete{" "}
              <strong className="text-gray-800">
                &ldquo;{activeResume.name}&rdquo;
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
