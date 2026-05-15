import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";

loadEnv({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for E2E tests.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function latestActiveProject() {
  return prisma.project.findFirstOrThrow({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    include: {
      scripts: {
        orderBy: { createdAt: "asc" },
        take: 1,
        include: {
          blocks: { orderBy: { position: "asc" } },
          beats: true,
          props: true,
          assetTasks: true,
        },
      },
      collaborators: { orderBy: { createdAt: "asc" } },
      share: true,
    },
  });
}

async function projectStatus(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { status: true, trashedAt: true },
  });

  return project;
}

async function clickButtonByText(page: Page, label: string) {
  await page.evaluate((buttonLabel) => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent?.trim() === buttonLabel,
    );

    if (!button) {
      throw new Error(`Button not found: ${buttonLabel}`);
    }

    button.click();
  }, label);
}

test("persists project create, trash, and restore", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();

  await page.getByRole("button", { name: "New Project" }).click({ force: true });
  await expect(page.getByRole("button", { name: /Untitled Script/ }).first()).toBeVisible();

  const created = await latestActiveProject();
  expect(created.status).toBe("active");

  await page.getByLabel("Home").click();
  const createdCard = page.getByTestId(`project-card-${created.id}`);
  await createdCard.getByRole("button", { name: "Delete" }).click({ force: true });

  await expect.poll(async () => (await projectStatus(created.id)).status).toBe("trashed");
  const trashed = await projectStatus(created.id);
  expect(trashed.status).toBe("trashed");
  expect(trashed.trashedAt).toBeTruthy();

  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "Restore" }).first().click({ force: true });
  await expect(page.getByRole("heading", { name: "Recents" })).toBeVisible();

  await expect.poll(async () => (await projectStatus(created.id)).status).toBe("active");
  const restored = await projectStatus(created.id);
  expect(restored.status).toBe("active");
  expect(restored.trashedAt).toBeNull();
});

test("persists script blocks and workbench records across refresh", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });

  await page.getByRole("button", { name: "Scene", exact: true }).click({ force: true });
  await page.getByRole("textbox", { name: /scene location block 1/i }).fill("e2e hangar");
  await page.getByRole("button", { name: "Invite" }).click({ force: true });
  await expect(page.getByRole("button", { name: /INT E2E HANGAR - DAY/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /INT E2E HANGAR - DAY/ })).toBeVisible();

  await page.getByTestId("script-block-1").click({
    button: "right",
    force: true,
  });
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();

  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.blocks.length)
    .toBe(2);
  let project = await latestActiveProject();
  let script = project.scripts[0];
  expect(script.blocks.map((block) => block.position)).toEqual([1, 2]);
  expect(script.blocks.map((block) => block.text)).toEqual([
    "INT. E2E HANGAR - DAY",
    "INT. E2E HANGAR - DAY",
  ]);

  await page.getByTestId("script-block-2").click({
    button: "right",
    force: true,
  });
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Delete" }).click();

  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.blocks.length)
    .toBe(1);
  project = await latestActiveProject();
  script = project.scripts[0];
  expect(script.blocks[0]?.position).toBe(1);

  await page.getByRole("button", { name: "Beats" }).click({ force: true });
  await clickButtonByText(page, "New Beat");
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.beats.length)
    .toBe(1);

  await page.getByRole("button", { name: "Props" }).click({ force: true });
  await clickButtonByText(page, "New Prop");
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.props.length)
    .toBe(1);

  await page.getByRole("button", { name: "Assets" }).click({ force: true });
  await clickButtonByText(page, "Import");
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.assetTasks.length)
    .toBe(1);

  await page.reload();

  project = await latestActiveProject();
  script = project.scripts[0];
  expect(script.beats).toHaveLength(1);
  expect(script.props).toHaveLength(1);
  expect(script.assetTasks).toHaveLength(1);
  expect(script.assetTasks[0]?.status).toBe("done");
});

test("downloads a Final Draft export from persisted script blocks", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });

  await page.getByRole("button", { name: "Scene", exact: true }).click({ force: true });
  await page.getByRole("textbox", { name: /scene location block 1/i }).fill("export bay");
  await page.getByRole("button", { name: "Invite" }).click({ force: true });
  await expect(page.getByRole("button", { name: /INT EXPORT BAY - DAY/ })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Final Draft" }).click({ force: true });
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/untitled-script-\d+\.fdx/);

  const path = await download.path();
  expect(path).toBeTruthy();

  const content = await readFile(path!, "utf8");
  expect(content).toContain("<FinalDraft");
  expect(content).toContain("INT. EXPORT BAY - DAY");
});

test("creates a persisted invite link and reviewer state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();
  const projectCountBefore = await prisma.project.count();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });
  await expect.poll(() => prisma.project.count()).toBe(projectCountBefore + 1);

  const created = await latestActiveProject();
  expect(created.collaborators).toHaveLength(1);

  await page.getByRole("button", { name: "Invite" }).click({ force: true });
  await expect(page.getByText("Share link")).toBeVisible();
  await expect(page.getByText(/\/share\//).first()).toBeVisible();
  await expect(page.getByText(/Reviewer 2/)).toBeVisible();

  const invited = await prisma.project.findUniqueOrThrow({
    where: { id: created.id },
    include: { collaborators: true, share: true },
  });

  expect(invited.share?.token).toBeTruthy();
  expect(invited.collaborators).toHaveLength(2);
  expect(invited.collaborators.some((collaborator) => collaborator.status === "Invited"))
    .toBe(true);
});
