export interface FilterCondition {
  column: string;
  op:
    | "="
    | "<>"
    | ">"
    | ">="
    | "<"
    | "<="
    | "like"
    | "not_like"
    | "in"
    | "is_null"
    | "is_not_null";
  value?: string;
}

export const FILTER_OPERATORS: {
  value: FilterCondition["op"];
  label: string;
  needsValue: boolean;
}[] = [
  { value: "=", label: "equals", needsValue: true },
  { value: "<>", label: "not equals", needsValue: true },
  { value: ">", label: "greater", needsValue: true },
  { value: ">=", label: "greater or equals", needsValue: true },
  { value: "<", label: "less", needsValue: true },
  { value: "<=", label: "less or equals", needsValue: true },
  { value: "like", label: "like", needsValue: true },
  { value: "not_like", label: "not like", needsValue: true },
  { value: "in", label: "in", needsValue: true },
  { value: "is_null", label: "is null", needsValue: false },
  { value: "is_not_null", label: "is not null", needsValue: false },
];
