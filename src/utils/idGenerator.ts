export const createIdGenerator = (): (() => string) => {
  let id = 0;
  return () => String(id++)
};
