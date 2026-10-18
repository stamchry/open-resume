import { View } from "@react-pdf/renderer";
import {
  ResumePDFSection,
  ResumePDFBulletList,
  ResumePDFText,
  ResumePDFLink,
} from "components/Resume/ResumePDF/common";
import { styles, spacing } from "components/Resume/ResumePDF/styles";
import type { ResumeProject } from "lib/redux/types";

export const ResumePDFProject = ({
  heading,
  projects,
  themeColor,
  isPDF,
  is2Page = false,
}: {
  heading: string;
  projects: ResumeProject[];
  themeColor: string;
  isPDF: boolean;
  is2Page?: boolean;
}) => {
  return (
    <ResumePDFSection themeColor={themeColor} heading={heading} is2Page={is2Page}>
      {projects.map(({ project, date, descriptions }, idx) => {
        const rawUrl = (date || "").trim();
        let src = "";

        // 1. Support markdown link syntax: [Display Text](url)
        const markdownMatch = rawUrl.match(/^\[(.*?)\]\((.*?)\)$/);
        if (markdownMatch) {
          src = markdownMatch[2].trim();
        } else if (rawUrl) {
          // 2. Check if it's a URL (http/https, github, gitlab, or domain without spaces)
          const isUrl =
            /^https?:\/\//i.test(rawUrl) ||
            /^(?:www\.)?github\.com/i.test(rawUrl) ||
            /^(?:www\.)?gitlab\.com/i.test(rawUrl) ||
            (!rawUrl.includes(" ") && rawUrl.includes("."));

          if (isUrl) {
            src = rawUrl;
          }
        }

        if (src && !src.startsWith("http://") && !src.startsWith("https://")) {
          src = `https://${src}`;
        }

        const isDate = Boolean(rawUrl && !src);
        const titleNode = <ResumePDFText bold={true}>{project}</ResumePDFText>;

        return (
          <View
            key={idx}
            wrap={false}
            style={
              idx !== 0
                ? { marginTop: is2Page ? spacing["2"] : spacing["1"] }
                : {}
            }
            {...{ "data-page-break-item": "true" }}
          >
            <View
              style={{
                ...styles.flexRowBetween,
                marginTop: is2Page ? spacing["1"] : spacing["0.5"],
              }}
            >
              {src ? (
                <ResumePDFLink src={src} isPDF={isPDF}>
                  {titleNode}
                </ResumePDFLink>
              ) : (
                titleNode
              )}
              {isDate ? <ResumePDFText>{rawUrl}</ResumePDFText> : null}
            </View>
            <View
              style={{
                ...styles.flexCol,
                marginTop: is2Page ? spacing["1"] : spacing["0.5"],
              }}
            >
              <ResumePDFBulletList items={descriptions} is2Page={is2Page} />
            </View>
          </View>
        );
      })}
    </ResumePDFSection>
  );
};
