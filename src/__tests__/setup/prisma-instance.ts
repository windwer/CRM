import { mockDeep } from "vitest-mock-extended";
import { PrismaClient } from "@antigravity/database";

export const prismaMock = mockDeep<PrismaClient>();
