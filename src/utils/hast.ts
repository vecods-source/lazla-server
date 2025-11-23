import bcrypt from "bcrypt";

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export const hashPassword = async (plain: string) => {
  return bcrypt.hash(plain, saltRounds);
};

export const comparePassword = async (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};
