import { View } from "@react-pdf/renderer";
import {
  ResumePDFSection,
  ResumePDFBulletList,
  ResumePDFText,
} from "components/Resume/ResumePDF/common";
import { styles, spacing } from "components/Resume/ResumePDF/styles";
import type { ResumeWorkExperience } from "lib/redux/types";

export const ResumePDFWorkExperience = ({
  heading,
  workExperiences,
  themeColor,
  is2Page = false,
}: {
  heading: string;
  workExperiences: ResumeWorkExperience[];
  themeColor: string;
  is2Page?: boolean;
}) => {
  return (
    <ResumePDFSection themeColor={themeColor} heading={heading} is2Page={is2Page}>
      {workExperiences.map(
        ({ company, jobTitle, date, descriptions, location }, idx) => {
          // Hide company name if it is the same as the previous company
          const hideCompanyName =
            idx > 0 && company === workExperiences[idx - 1].company;

          return (
            <View
              key={idx}
              wrap={false}
              style={
                idx !== 0
                  ? { marginTop: is2Page ? spacing["2.5"] : spacing["1.5"] }
                  : {}
              }
              {...{ "data-page-break-item": "true" }}
            >
              {!hideCompanyName && (
                <View style={styles.flexRowBetween}>
                  <ResumePDFText bold={true}>{company}</ResumePDFText>
                  {location ? <ResumePDFText>{location}</ResumePDFText> : null}
                </View>
              )}
            <View
              style={{
                ...styles.flexRowBetween,
                marginTop: hideCompanyName
                  ? "-" + spacing["1"]
                  : is2Page
                  ? spacing["1.5"]
                  : spacing["1"],
              }}
            >
              <ResumePDFText>{jobTitle}</ResumePDFText>
              <ResumePDFText>{date}</ResumePDFText>
            </View>
            <View
              style={{
                ...styles.flexCol,
                marginTop: is2Page ? spacing["1.5"] : spacing["1"],
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
