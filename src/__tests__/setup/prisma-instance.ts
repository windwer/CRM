import { mockDeep } from "vitest-mock-extended";
import { PrismaClient } from "@smartcrm/database";

export const prismaMock = mockDeep<PrismaClient>();
