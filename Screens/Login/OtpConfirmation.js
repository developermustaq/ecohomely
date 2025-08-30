// OtpConfirmation.js
let confirmation = null;

const setConfirmation = (conf) => {
  confirmation = conf;
};

const getConfirmation = () => {
  return confirmation;
};

const clearConfirmation = () => {
  confirmation = null;
};

export { setConfirmation, getConfirmation, clearConfirmation };
