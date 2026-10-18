"use client";
import { useEffect, useRef } from "react";
import {
  A4_HEIGHT_PX,
  LETTER_HEIGHT_PX,
  PX_PER_PT,
} from "lib/constants";

/**
 * ResumePreviewPaginator is only active in interactive DOM preview (isPDF = false)
 * when pageCount is "2". It measures the rendered DOM items inside the iframe,
 * finds the first item that overflows Page 1, and dynamically inserts a clean
 * page-break separator with Page 2's top banner so the interactive preview
 * matches the exported 2-page PDF.
 */
export const ResumePreviewPaginator = ({
  documentSize,
  themeColor,
  showTopLine = true,
}: {
  documentSize: string;
  themeColor: string;
  showTopLine?: boolean;
}) => {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!markerRef.current) return;
    const doc = markerRef.current.ownerDocument;
    if (!doc) return;

    const pageContainer = (markerRef.current.closest(
      "[data-page-container]"
    ) || markerRef.current.parentElement) as HTMLElement;
    if (!pageContainer) return;

    // 1. Remove previous page break element if any to get clean measurement
    const existingBreak = pageContainer.querySelector(
      ".resume-preview-page-break"
    );
    if (existingBreak) {
      existingBreak.remove();
    }

    const isA4 = documentSize === "A4";
    const pageHeightPx = isA4 ? A4_HEIGHT_PX : LETTER_HEIGHT_PX;
    // In React-PDF: top fixed container is 21pt, paddingBottom is 18pt = 39pt total
    const cutoffY = pageHeightPx - Math.round(39 * PX_PER_PT);

    const containerTop = pageContainer.getBoundingClientRect().top;
    const items = Array.from(
      pageContainer.querySelectorAll<HTMLElement>("[data-page-break-item]")
    );

    if (items.length === 0) return;

    let splitItem: HTMLElement | null = null;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const relativeBottom = rect.bottom - containerTop;
      if (relativeBottom > cutoffY) {
        splitItem = item;
        break;
      }
    }

    if (!splitItem) return;

    // If splitItem is the very first entry of its section, break before the section
    // so the section heading is not orphaned on Page 1
    let targetBreakNode: HTMLElement = splitItem;
    const parentSection = splitItem.closest(
      "[data-page-section]"
    ) as HTMLElement | null;
    if (parentSection) {
      const firstItemInSection = parentSection.querySelector(
        "[data-page-break-item]"
      );
      if (firstItemInSection === splitItem) {
        targetBreakNode = parentSection;
      }
    }

    // 2. Calculate remaining space on Page 1
    const splitRect = targetBreakNode.getBoundingClientRect();
    const currentTop = splitRect.top - containerTop;
    const PAGE_GAP_PX = 28;
    const remainderPage1 = Math.max(0, pageHeightPx - currentTop);

    // 2-page horizontal padding is spacing[14] = 42pt = 56px
    const horizontalPaddingPx = Math.round(42 * PX_PER_PT);

    // 3. Construct page-break container
    const breakEl = doc.createElement("div");
    breakEl.className = "resume-preview-page-break";
    breakEl.style.width = `calc(100% + ${horizontalPaddingPx * 2}px)`;
    breakEl.style.marginLeft = `-${horizontalPaddingPx}px`;
    breakEl.style.marginRight = `-${horizontalPaddingPx}px`;
    breakEl.style.display = "flex";
    breakEl.style.flexDirection = "column";

    // Spacer to fill the bottom of Page 1
    if (remainderPage1 > 0) {
      const p1Spacer = doc.createElement("div");
      p1Spacer.style.height = `${remainderPage1}px`;
      p1Spacer.style.width = "100%";
      breakEl.appendChild(p1Spacer);
    }

    // Visual page divider bar in the gap
    const divider = doc.createElement("div");
    divider.style.height = `${PAGE_GAP_PX}px`;
    divider.style.width = "100%";
    divider.style.display = "flex";
    divider.style.alignItems = "center";
    divider.style.justifyContent = "center";
    divider.style.position = "relative";
    divider.style.backgroundColor = "#f3f4f6";
    divider.style.borderTop = "1px dashed #d1d5db";
    divider.style.borderBottom = "1px dashed #d1d5db";
    divider.style.fontSize = "10px";
    divider.style.fontFamily = "sans-serif";
    divider.style.color = "#6b7280";
    divider.style.letterSpacing = "0.1em";
    divider.style.textTransform = "uppercase";
    divider.style.fontWeight = "600";
    divider.innerText = "Page 2";
    breakEl.appendChild(divider);

    // Top margin container on Page 2 (21pt total height, identical to Page 1 and React-PDF)
    const topContainer = doc.createElement("div");
    topContainer.style.width = "100%";
    topContainer.style.height = "21pt";
    topContainer.style.display = "flex";
    topContainer.style.flexDirection = "column";

    if (showTopLine && themeColor) {
      const topBar = doc.createElement("div");
      topBar.style.width = "100%";
      topBar.style.height = "10.5pt";
      topBar.style.backgroundColor = themeColor;
      topContainer.appendChild(topBar);
    }
    breakEl.appendChild(topContainer);

    targetBreakNode.parentNode?.insertBefore(breakEl, targetBreakNode);
  });

  return <div ref={markerRef} style={{ display: "none" }} />;
};
