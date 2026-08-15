import { BindingType, PrintOption, PrintType } from "@prisma/client";

const serviceBase: Record<string, number> = {
  "Project & Thesis Formatting": 5000,
  "Research Assistance": 5000,
  "Assignment & Term-Paper Support": 3000,
  "Data Analysis Assistance": 7500,
  "Printing & Binding": 1000,
  "Campus Delivery": 1500,
};

export function calculateQuote(input: {
  service: string;
  printOption: PrintOption;
  printType: PrintType;
  copies: number;
  binding: BindingType;
  delivery: boolean;
}) {
  let total = serviceBase[input.service] ?? 3000;
  if (input.printOption !== PrintOption.DIGITAL_ONLY) {
    total += input.copies * (input.printType === PrintType.COLOUR ? 1500 : 700);
    if (input.binding === BindingType.SPIRAL) total += 1500 * input.copies;
    if (input.binding === BindingType.SOFT) total += 2500 * input.copies;
    if (input.binding === BindingType.HARD) total += 5000 * input.copies;
  }
  if (input.delivery) total += 1500;
  return Math.max(total, 1000);
}
