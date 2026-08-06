import { DepartmentKind } from "@prisma/client";

export const CENTRAL_OFFICE_DEPARTMENT_NAME =
  "Office of the County Secretary and Head of Public Service";

export const CENTRAL_OFFICE_DEPARTMENT_CODE = "OCS-HPS";

export const CENTRAL_OFFICE_DEPARTMENT_DESCRIPTION =
  "Central control office for registration, review, dispatch, oversight, and closure.";

export const EXECUTION_DEPARTMENT_DESCRIPTION_HINT =
  "Execution unit that receives and works on dispatched correspondence.";

export function isCentralOfficeDepartmentName(name: string) {
  return (
    name.trim().toLowerCase() === CENTRAL_OFFICE_DEPARTMENT_NAME.toLowerCase()
  );
}

export function getDepartmentKindLabel(kind: DepartmentKind) {
  return kind === DepartmentKind.CENTRAL_OFFICE
    ? "Central office"
    : "Execution unit";
}
