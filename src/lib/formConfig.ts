// EDIT HERE to change the registration form fields.
// This single config drives the public form, the admin responses table, and the CSV export.
export type FormField = {
  id: string;
  label: string;
  type: "text" | "tel" | "number" | "textarea" | "select";
  required: boolean;
  options?: string[]; // for select
  min?: number; // for number
};

export const formFields: FormField[] = [
  { id: "fullName", label: "الاسم", type: "text", required: true },
  { id: "phone", label: "رقم الهاتف", type: "tel", required: true },
  { id: "age", label: "العمر", type: "number", required: true, min: 1 },
  { id: "area", label: "المنطقة", type: "text", required: true },
  {
    id: "attendanceConfidence",
    label: "هل أنت متأكد من حضورك؟",
    type: "select",
    required: true,
    options: ["نعم", "لست متأكد"],
  },
];
