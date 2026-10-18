import { View } from "@react-pdf/renderer";
import {
  ResumePDFBulletList,
  ResumePDFSection,
  ResumePDFText,
} from "components/Resume/ResumePDF/common";
import { styles, spacing } from "components/Resume/ResumePDF/styles";
import type { ResumeEducation } from "lib/redux/types";

export const ResumePDFEducation = ({
  heading,
  educations,
  themeColor,
  showBulletPoints,
  is2Page = false,
}: {
  heading: string;
  educations: ResumeEducation[];
  themeColor: string;
  showBulletPoints: boolean;
  is2Page?: boolean;
}) => {
  return (
    <ResumePDFSection themeColor={themeColor} heading={heading} is2Page={is2Page}>
      {educations.map(
        ({ school, degree, date, gpa, descriptions = [], location }, idx) => {
          // Hide school name if it is the same as the previous school
          const hideSchoolName =
            idx > 0 && school === educations[idx - 1].school;
          const showDescriptions = descriptions.join() !== "";

          return (
            <View
              key={idx}
              wrap={false}
              style={
                idx !== 0
                  ? { marginTop: is2Page ? spacing["2"] : spacing["1.5"] }
                  : {}
              }
              {...{ "data-page-break-item": "true" }}
            >
              {!hideSchoolName && (
                <View style={styles.flexRowBetween}>
                  <ResumePDFText bold={true}>{school}</ResumePDFText>
                  {location ? <ResumePDFText>{location}</ResumePDFText> : null}
                </View>
              )}
              <View
                style={{
                  ...styles.flexRowBetween,
                  marginTop: hideSchoolName
                    ? "-" + spacing["1"]
                    : is2Page
                    ? spacing["1.5"]
                    : spacing["1"],
                }}
              >
                <ResumePDFText>{`${
                  gpa
                    ? `${degree} - ${Number(gpa) ? gpa + " GPA" : gpa}`
                    : degree
                }`}</ResumePDFText>
                <ResumePDFText>{date}</ResumePDFText>
              </View>
              {showDescriptions && (
                <View
                  style={{
                    ...styles.flexCol,
                    marginTop: is2Page ? spacing["1.5"] : spacing["1"],
                  }}
                >
                  <ResumePDFBulletList
                    items={descriptions}
                    showBulletPoints={showBulletPoints}
                    is2Page={is2Page}
                  />
                </View>
              )}
            </View>
          );
        }
      )}
    </ResumePDFSection>
  );
};
