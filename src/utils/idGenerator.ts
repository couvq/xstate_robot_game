export const createIdGenerator = (): (() => string) => {
  let id = 0;
  return () => {
    ++id;
    return String(id);
  };
};
