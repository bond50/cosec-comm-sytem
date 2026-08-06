export type CorrespondenceActionState<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TData = unknown,
> = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Partial<TValues>;
  data?: TData;
};

export function createInitialCorrespondenceActionState<
  TValues extends Record<string, unknown>,
>(values: TValues): CorrespondenceActionState<TValues> {
  return {
    ok: false,
    message: "",
    fieldErrors: {},
    values,
  };
}
