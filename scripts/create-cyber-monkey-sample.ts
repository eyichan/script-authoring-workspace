import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const projectId = "project-cyber-monkey-heaven";
const scriptId = "script-cyber-monkey-heaven";
const title = "Monkey King.exe: Havoc in the Cloud Palace";

const blocks = [
  {
    type: "transition",
    text: "FADE IN:",
  },
  {
    type: "scene",
    text: "EXT. NEON CHANG'AN SKYWAY - NIGHT",
  },
  {
    type: "action",
    text:
      "Rain falls upward from the city below. Delivery drones split around a gold-streaked rider surfing a stolen police hoverbike.",
  },
  {
    type: "character",
    text: "SUN WUKONG",
  },
  {
    type: "paren",
    text: "(into a cracked throat mic)",
  },
  {
    type: "dialogue",
    text:
      "Tell Heaven their firewall is old, their badges are fake, and their favorite monkey just learned root access.",
  },
  {
    type: "scene",
    text: "INT. CLOUD PALACE DATA CENTER - NIGHT",
  },
  {
    type: "action",
    text:
      "The celestial bureaucracy has become a white-glass server cathedral. Immortal clerks float in ergonomic pods, stamping petitions with biometric seals.",
  },
  {
    type: "character",
    text: "NEZHA",
  },
  {
    type: "dialogue",
    text:
      "Wukong, stand down. The Jade Emperor upgraded every gate after your last prank.",
  },
  {
    type: "character",
    text: "SUN WUKONG",
  },
  {
    type: "dialogue",
    text:
      "Then he should have upgraded his imagination.",
  },
  {
    type: "action",
    text:
      "Wukong flicks his carbon-fiber staff. It telescopes into a glowing command spear, writing breach code in the air with each spin.",
  },
  {
    type: "scene",
    text: "INT. JADE EMPEROR'S THRONE ROOM - NIGHT",
  },
  {
    type: "action",
    text:
      "A throne of black jade hovers above a real-time map of the solar system. Every orbit is tagged, taxed, and watched.",
  },
  {
    type: "character",
    text: "JADE EMPEROR",
  },
  {
    type: "dialogue",
    text:
      "You were offered a title, a salary, and a parking space in the eastern cloud dock.",
  },
  {
    type: "character",
    text: "SUN WUKONG",
  },
  {
    type: "dialogue",
    text:
      "You offered me a cage with better lighting.",
  },
  {
    type: "scene",
    text: "EXT. ORBITAL PEACH GARDEN - DAWN",
  },
  {
    type: "action",
    text:
      "The legendary peaches grow inside zero-gravity bio-domes, each fruit wrapped in security scripture and sensor mesh.",
  },
  {
    type: "character",
    text: "GUANYIN",
  },
  {
    type: "dialogue",
    text:
      "Break the palace if you must, but do not become another system that only knows how to rule.",
  },
  {
    type: "character",
    text: "SUN WUKONG",
  },
  {
    type: "dialogue",
    text:
      "I am not here to rule Heaven. I am here to make it reboot.",
  },
  {
    type: "transition",
    text: "CUT TO BLACK.",
  },
] as const;

async function main() {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true },
  });

  if (existing) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "active",
        trashedAt: null,
        updatedAt: new Date(),
      },
    });

    console.log(
      `${existing.title} already exists. Reactivated and moved to the top without overwriting script content.`,
    );
    return;
  }

  await prisma.project.create({
    data: {
      id: projectId,
      title,
      collaborators: {
        create: [
          {
            id: "collaborator-cyber-monkey-owner",
            initials: "SW",
            role: "Owner",
            status: "Editing",
          },
          {
            id: "collaborator-cyber-monkey-reviewer",
            initials: "NZ",
            role: "Action Consultant",
            status: "Reviewing",
          },
        ],
      },
      share: {
        create: {
          token: "cybermonkeyheaven",
        },
      },
      scripts: {
        create: {
          id: scriptId,
          title,
          blocks: {
            create: blocks.map((block, index) => ({
              id: `block-cyber-monkey-${String(index + 1).padStart(2, "0")}`,
              type: block.type,
              text: block.text,
              position: index + 1,
            })),
          },
          beats: {
            create: [
              {
                id: "beat-cyber-monkey-1",
                title: "Beat 1: Root Access",
                description:
                  "Wukong enters Heaven as a network intruder instead of a court guest.",
                color: "racing-green",
                durationMinutes: 6,
              },
              {
                id: "beat-cyber-monkey-2",
                title: "Beat 2: Server Cathedral Duel",
                description:
                  "Nezha tries to contain the breach while Wukong turns bureaucracy into spectacle.",
                color: "cobalt",
                durationMinutes: 10,
              },
              {
                id: "beat-cyber-monkey-3",
                title: "Beat 3: The Cage With Better Lighting",
                description:
                  "The Jade Emperor frames order as generosity; Wukong names it control.",
                color: "amber",
                durationMinutes: 8,
              },
              {
                id: "beat-cyber-monkey-4",
                title: "Beat 4: Reboot Heaven",
                description:
                  "Guanyin redirects rebellion away from domination and toward liberation.",
                color: "violet",
                durationMinutes: 7,
              },
            ],
          },
          props: {
            create: [
              {
                id: "prop-cyber-monkey-staff",
                name: "Ruyi Jingu Bang Command Spear",
                category: "Weapon / Interface",
                description:
                  "A carbon-fiber staff that writes executable breach code through movement.",
                imageNote:
                  "Black carbon shaft, gold circuitry veins, telescoping holographic tip.",
              },
              {
                id: "prop-cyber-monkey-crown",
                name: "Neural Golden Fillet",
                category: "Control Device",
                description:
                  "A saintly compliance halo redesigned as a neural permissions lock.",
                imageNote:
                  "Thin gold band with temple contacts and pulsing Sanskrit microtext.",
              },
              {
                id: "prop-cyber-monkey-peach",
                name: "Immortality Peach Capsule",
                category: "Biotech Relic",
                description:
                  "A zero-gravity fruit used as both mythic reward and corporate life-extension product.",
                imageNote:
                  "Peach suspended in transparent gel, guarded by sensor mesh.",
              },
            ],
          },
          assetTasks: {
            create: [
              {
                id: "asset-cyber-monkey-skyway",
                kind: "scene_dramatization",
                title: "Neon Chang'an Skyway chase reference",
                status: "done",
              },
              {
                id: "asset-cyber-monkey-palace",
                kind: "movie_poster",
                title: "Cloud Palace server cathedral key art",
                status: "done",
              },
              {
                id: "asset-cyber-monkey-trailer",
                kind: "concept_trailer",
                title: "Havoc in the Cloud Palace teaser cut",
                status: "queued",
              },
            ],
          },
        },
      },
    },
  });

  console.log(`Created sample project: ${title}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
