import { View } from "@react-pdf/renderer";
import {
  ResumePDFSection,
  ResumePDFBulletList,
} from "components/Resume/ResumePDF/common";
import { styles } from "components/Resume/ResumePDF/styles";
import type { ResumeCustom } from "lib/redux/types";

export const ResumePDFCustom = ({
  heading,
  custom,
  themeColor,
  showBulletPoints,
  is2Page = false,
}: {
  heading: string;
  custom: ResumeCustom;
  themeColor: string;
  showBulletPoints: boolean;
  is2Page?: boolean;
}) => {
  const { descriptions } = custom;

  return (
    <ResumePDFSection themeColor={themeColor} heading={heading} is2Page={is2Page}>
      <View style={{ ...styles.flexCol }} {...{ "data-page-break-item": "true" }}>
        <ResumePDFBulletList
          items={descriptions}
          showBulletPoints={showBulletPoints}
          is2Page={is2Page}
        />
      </View>
    </ResumePDFSection>
  );
};
