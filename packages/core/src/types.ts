export interface Catalog {
  schemaVersion: 0;
  generator: string;
  generatedAt: string;
  components: ComponentDoc[];
  warnings: string[];
}

export interface ComponentDoc {
  id: string;
  name: string;
  filePath: string;
  description?: string;
  props: PropDoc[];
  cva?: CvaDoc;
}

export type PropSource = "declared" | "cva";

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  source: PropSource;
}

export interface CvaDoc {
  exportName?: string;
  base?: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string>;
  compoundVariants?: CompoundVariantDoc[];
}

export interface CompoundVariantDoc {
  conditions: Record<string, string>;
  className: string;
}

export interface VariantAxis {
  name: string;
  options: string[];
}

export interface AnalyzeOptions {
  root: string;
  tsconfigPath?: string;
  include?: string[];
}
