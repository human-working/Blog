import bcrypt from "bcrypt";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User"

async function seedUsers() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);

  const password = await bcrypt.hash("Password123!", 10);

  const users = [
    {
      username: "void_user",
      email: "void_user@example.com",
      password,
      role: "mod",
      isVerified: true,
    },
    {
      username: "arch_rat",
      email: "arch_rat@example.com",
      password,
      role: "member",
      isVerified: true,
    },
    {
      username: "0xdead",
      email: "0xdead@example.com",
      password,
      role: "member",
      isVerified: true,
    },
    {
      username: "kernel_panic",
      email: "kernel_panic@example.com",
      password,
      role: "member",
      isVerified: true,
    },
  ];

  await userRepository.save(users);

  console.log("✅ Seeded users");

  await AppDataSource.destroy();
}

seedUsers().catch(console.error);