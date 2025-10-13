const randomNum = (): string => {
  return Math.floor(1e9 + Math.random() * 9e9).toString();
};
export default randomNum;
