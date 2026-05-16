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

async function projectTitleState(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      title: true,
      scripts: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { title: true },
      },
    },
  });
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
  await expect(page.getByLabel("Project title")).toHaveValue(/Untitled Script/);

  const created = await latestActiveProject();
  expect(created.status).toBe("active");

  await page.getByLabel("Project title").fill("Renamed E2E Project");
  await page.getByLabel("Project title").press("Enter");

  await expect
    .poll(async () => projectTitleState(created.id))
    .toEqual({
      title: "Renamed E2E Project",
      scripts: [{ title: "Renamed E2E Project" }],
    });

  await page.reload();
  await expect(page.getByLabel("Project title")).toHaveValue("Renamed E2E Project");

  await page.getByLabel("Home").click();
  const createdCard = page.getByTestId(`project-card-${created.id}`);
  await createdCard.getByRole("button", { name: "Delete" }).click({ force: true });

  await expect.poll(async () => (await projectStatus(created.id)).status).toBe("trashed");
  const trashed = await projectStatus(created.id);
  expect(trashed.status).toBe("trashed");
  expect(trashed.trashedAt).toBeTruthy();

  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "Restore" }).first().click({ force: true });
  await expect(page.getByLabel("Project title")).toHaveValue("Renamed E2E Project");

  await expect.poll(async () => (await projectStatus(created.id)).status).toBe("active");
  const restored = await projectStatus(created.id);
  expect(restored.status).toBe("active");
  expect(restored.trashedAt).toBeNull();
});

test("commits the current script line before Enter inserts the next block", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });

  await page.getByRole("button", { name: "Scene", exact: true }).click({ force: true });
  const sceneInput = page.getByRole("textbox", { name: /scene location block 1/i });
  await sceneInput.fill("enter bridge");
  await sceneInput.press("Enter");

  await expect(page.getByRole("textbox", { name: /action block 2/i })).toBeFocused();
  await expect
    .poll(async () => {
      const project = await latestActiveProject();
      return project.scripts[0]?.blocks.map((block) => ({
        position: block.position,
        text: block.text,
        type: block.type,
      }));
    })
    .toEqual([
      { position: 1, text: "INT. ENTER BRIDGE - DAY", type: "scene" },
      { position: 2, text: "", type: "action" },
    ]);
});

test("persists character and dialogue authoring flow", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });
  await expect(page.getByLabel("Project title")).toHaveValue(/Untitled Script/);

  const characterTool = page.locator("button").filter({ hasText: /^Character$/ }).last();
  await expect(characterTool).toBeEnabled();
  await characterTool.click({ force: true });
  await page.getByLabel(/character block 1/i).fill("Ada Lovelace");
  await page.getByLabel(/character block 1/i).press("Enter");

  const dialogueInput = page.getByRole("textbox", { name: /dialogue block 2/i });
  await expect(dialogueInput).toBeFocused();
  await dialogueInput.fill("The engine has a memory.");
  await dialogueInput.press("Enter");

  await expect
    .poll(async () => {
      const project = await latestActiveProject();
      return project.scripts[0]?.blocks.map((block) => ({
        position: block.position,
        text: block.text,
        type: block.type,
      }));
    })
    .toEqual([
      { position: 1, text: "ADA LOVELACE", type: "character" },
      { position: 2, text: "The engine has a memory.", type: "dialogue" },
      { position: 3, text: "", type: "character" },
    ]);

  await page.reload();
  await page.getByRole("button", { name: "Characters" }).click({ force: true });
  await expect(page.getByRole("button", { name: /ADA LOVELACE/ })).toBeVisible();
});

test("opens script blocks in matching workbench destinations", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });

  await page.getByRole("button", { name: "Scene", exact: true }).click({ force: true });
  await page.getByRole("textbox", { name: /scene location block 1/i }).fill("open bridge");
  await page.locator('[data-testid^="script-block-"]').first().click({
    button: "right",
    force: true,
  });
  await page.getByRole("menuitem", { name: "Open" }).click();
  await expect(page.getByText("Scene Board")).toBeVisible();
  await expect(page.locator("main .ring-2")).toHaveCount(1);

  await page.getByLabel("Home").click();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });

  await page.locator("button").filter({ hasText: /^Character$/ }).last().click({
    force: true,
  });
  const characterInput = page.locator('input[aria-label^="character block"]').first();
  await characterInput.fill("Kai Navigator");
  await characterInput.press("Enter");

  const dialogueInput = page.locator('textarea[aria-label^="dialogue block"]').first();
  await dialogueInput.fill("The map points back to us.");

  await characterInput.click({
    button: "right",
    force: true,
  });
  await page.getByRole("menuitem", { name: "Open" }).click();
  await expect(page.getByText("Characters").first()).toBeVisible();
  await expect(page.locator("main .ring-2")).toHaveCount(1);

  await clickButtonByText(page, "Script");
  await page.locator('textarea[aria-label^="dialogue block"]').first().click({
    button: "right",
    force: true,
  });
  await page.getByRole("menuitem", { name: "Open" }).click();
  await expect(page.getByText("Characters").first()).toBeVisible();
  await expect(page.locator("main .ring-2")).toHaveCount(1);
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

  await page.getByRole("button", { name: "Beats" }).click({ force: true });
  await page.getByLabel("Beat title 1").fill("Revised Beat");
  await page.getByLabel("Beat title 1").press("Enter");
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.beats[0]?.title)
    .toBe("Revised Beat");
  await page.getByRole("button", { name: "Delete Revised Beat" }).click({
    force: true,
  });
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.beats.length)
    .toBe(0);

  await page.getByRole("button", { name: "Props" }).click({ force: true });
  await page.getByLabel("Prop title Continuity Tag 1").fill("Hero Key");
  await page.getByLabel("Prop title Continuity Tag 1").press("Enter");
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.props[0]?.name)
    .toBe("Hero Key");
  await page.getByRole("button", { name: "Delete Hero Key" }).click({
    force: true,
  });
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.props.length)
    .toBe(0);

  await page.getByRole("button", { name: "Assets" }).click({ force: true });
  await page.getByLabel("Asset title Imported still reference 1").fill("Revised Still");
  await page.getByLabel("Asset title Imported still reference 1").press("Enter");
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.assetTasks[0]?.title)
    .toBe("Revised Still");
  await page.getByRole("button", { name: "Delete Revised Still" }).click({
    force: true,
  });
  await expect
    .poll(async () => (await latestActiveProject()).scripts[0]?.assetTasks.length)
    .toBe(0);
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

  await page.getByRole("tab", { name: "Info" }).click();
  await clickButtonByText(page, "PDF");
  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF" }).click({ force: true });
  const pdfDownload = await pdfDownloadPromise;

  expect(pdfDownload.suggestedFilename()).toMatch(/untitled-script-\d+\.pdf/);

  const pdfPath = await pdfDownload.path();
  expect(pdfPath).toBeTruthy();

  const pdfContent = await readFile(pdfPath!, "utf8");
  expect(pdfContent).toMatch(/^%PDF-1\.4/);
  expect(pdfContent).toContain("INT. EXPORT BAY - DAY");
});

test("manages persisted invite links and reviewer state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Home").click();
  const projectCountBefore = await prisma.project.count();
  await page.getByRole("button", { name: "New Project" }).click({ force: true });
  await expect.poll(() => prisma.project.count()).toBe(projectCountBefore + 1);

  const created = await latestActiveProject();
  expect(created.collaborators).toHaveLength(1);

  await page.getByRole("button", { name: "Scene", exact: true }).click({ force: true });
  await page.getByRole("textbox", { name: /scene location block 1/i }).fill("share room");
  await expect(page.getByRole("button", { name: /INT SHARE ROOM - DAY/ })).toBeVisible();

  await page.getByRole("button", { name: "Invite" }).click({ force: true });
  await expect(page.getByText("Share link")).toBeVisible();
  await expect(page.getByText(/\/share\//).first()).toBeVisible();
  await expect(page.getByLabel("Collaborator role Reviewer 2")).toHaveValue(
    "Reviewer 2",
  );

  const invited = await prisma.project.findUniqueOrThrow({
    where: { id: created.id },
    include: { collaborators: true, share: true },
  });

  expect(invited.share?.token).toBeTruthy();
  expect(invited.collaborators).toHaveLength(2);
  expect(invited.collaborators.some((collaborator) => collaborator.status === "Invited"))
    .toBe(true);
  const shareToken = invited.share!.token;

  await page.getByLabel("Collaborator role Reviewer 2").fill("Producer");
  await page.getByLabel("Collaborator role Reviewer 2").press("Enter");
  await expect
    .poll(async () => {
      const project = await prisma.project.findUniqueOrThrow({
        where: { id: created.id },
        include: { collaborators: true },
      });
      return project.collaborators.find((collaborator) => collaborator.role === "Producer")
        ?.status;
    })
    .toBe("Invited");

  await page.getByLabel("Collaborator status Producer").selectOption("Reviewing");
  await expect
    .poll(async () => {
      const project = await prisma.project.findUniqueOrThrow({
        where: { id: created.id },
        include: { collaborators: true },
      });
      return project.collaborators.find((collaborator) => collaborator.role === "Producer")
        ?.status;
    })
    .toBe("Reviewing");

  await page.goto(`/share/${shareToken}`);
  await expect(page.getByText("Read-only review link")).toBeVisible();
  await expect(page.getByText("INT. SHARE ROOM - DAY").first()).toBeVisible();
  await expect(page.getByText("Producer").first()).toBeVisible();
  await expect(page.getByText("Reviewing").first()).toBeVisible();

  await page.goto("/");
  await page.getByLabel("Home").click();
  await page
    .getByTestId(`project-card-${created.id}`)
    .getByRole("button", { name: "Open" })
    .click({ force: true });
  await page.getByRole("tab", { name: "Collaboration" }).click();
  await expect(page.getByText(`/share/${shareToken}`)).toBeVisible();
  await page.getByRole("button", { name: "Remove Producer" }).click({
    force: true,
  });
  await expect
    .poll(async () => {
      const project = await prisma.project.findUniqueOrThrow({
        where: { id: created.id },
        include: { collaborators: true },
      });
      return project.collaborators.map((collaborator) => collaborator.role).sort();
    })
    .toEqual(["Owner"]);

  await expect(page.getByText(`/share/${shareToken}`)).toBeVisible();
  await page.getByRole("button", { name: "Revoke" }).click({ force: true });
  await expect
    .poll(async () => {
      const project = await prisma.project.findUniqueOrThrow({
        where: { id: created.id },
        include: { share: true },
      });
      return project.share;
    })
    .toBeNull();

  const revokedResponse = await page.goto(`/share/${shareToken}`);
  expect(revokedResponse?.status()).toBe(404);
});
