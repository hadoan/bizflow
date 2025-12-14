declare module "class-variance-authority" {
  // Minimal typings to satisfy usage in UI components
  export type VariantProps<T extends (...args: unknown[]) => unknown> = NonNullable<Parameters<T>[0]>;

  export function cva(
    base?: string,
    options?: {
      variants?: Record<string, Record<string, string>>;
      compoundVariants?: Array<Record<string, string | string[]>>;
      defaultVariants?: Record<string, string>;
    }
  ): (props?: Record<string, string | undefined> & { className?: string }) => string;
}
