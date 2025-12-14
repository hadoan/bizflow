declare module "class-variance-authority" {
  // Configuration types for cva
  type ConfigSchema = Record<string, Record<string, string>>;

  type ConfigVariants<T extends ConfigSchema> = {
    [Variant in keyof T]?: keyof T[Variant] | null | undefined;
  };

  type Config<T extends ConfigSchema> = {
    variants?: T;
    compoundVariants?: Array<
      Partial<ConfigVariants<T>> & {
        className: string;
      }
    >;
    defaultVariants?: ConfigVariants<T>;
  };

  // Props type for variant components - extracts the variant props from a cva function
  export type VariantProps<T> = T extends (
    props?: infer P
  ) => string
    ? P extends Record<string, unknown>
      ? Omit<P, "class" | "className">
      : never
    : never;

  // Main cva function with generic type parameter
  export function cva<T extends ConfigSchema>(
    base?: string | string[],
    config?: Config<T>
  ): (props?: ConfigVariants<T> & { className?: string; class?: string }) => string;
}
