export const createIdGenerator = (prefix: string): (() => string) => {
  let id = 0;
  return () => `${prefix}_${id++}`;
};
