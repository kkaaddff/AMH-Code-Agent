export const mongoose = {
  client: {
    uri: "mongodb://10.13.67.90:27017/fta",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      user: "ftauser",
      pass: "123456",
    },
  },
};
