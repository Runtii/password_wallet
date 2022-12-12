module.exports = async () => {
  process.env.TZ = "EST";
  return {
    verbose: true,
  };
};
