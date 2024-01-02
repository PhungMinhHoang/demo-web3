export const truncateBetween = (text?: string) => {
  if (!text) return "";

  return `${text.slice(0, 4)}...${text.slice(text.length - 4, text.length)}`;
};
