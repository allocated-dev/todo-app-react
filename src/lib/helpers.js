export const getClasses = (...classes) => {
  return classes.filter(Boolean).join(" ");
};
