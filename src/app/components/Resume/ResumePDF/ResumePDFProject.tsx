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
}: {
  heading: string;
  projects: ResumeProject[];
  themeColor: string;
  isPDF: boolean;
}) => {
  return (
    <ResumePDFSection themeColor={themeColor} heading={heading}>
      {projects.map(({ project, date, descriptions }, idx) => {
        const textUrl = date || "";
        const src = textUrl.startsWith("http") ? textUrl : `https://${textUrl}`;

        return (
          <View key={idx}>
            <View
              style={{
                ...styles.flexRowBetween,
                marginTop: spacing["0.5"],
              }}
            >
              <ResumePDFText bold={true}>{project}</ResumePDFText>
              {textUrl ? (
                <ResumePDFLink src={src} isPDF={isPDF}>
                  <ResumePDFText>{textUrl}</ResumePDFText>
                </ResumePDFLink>
              ) : null}
            </View>
            <View style={{ ...styles.flexCol, marginTop: spacing["0.5"] }}>
              <ResumePDFBulletList items={descriptions} />
            </View>
          </View>
        );
      })}
    </ResumePDFSection>
  );
};
