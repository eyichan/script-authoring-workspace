"use client";

import type { FormEvent, ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  Beat,
  CharacterProfile,
  DerivedCharacter,
  DerivedLocation,
  DerivedScene,
  LocationProfile,
  Prop,
  SceneProductionNote,
} from "@/lib/domain/types";

export type EntityDetailTarget =
  | { kind: "beat"; id: string }
  | { kind: "character"; id: string }
  | { kind: "scene"; id: string }
  | { kind: "location"; id: string }
  | { kind: "prop"; id: string };

type CharacterProfileInput = Omit<CharacterProfile, "id" | "scriptId">;
type SceneProductionNoteInput = Omit<SceneProductionNote, "id" | "scriptId">;
type LocationProfileInput = Omit<LocationProfile, "id" | "scriptId">;
type BeatDetailInput = Pick<
  Beat,
  "id" | "title" | "description" | "color" | "durationMinutes"
>;
type PropDetailInput = Pick<
  Prop,
  "id" | "name" | "themeColor" | "category" | "description" | "imageNote"
>;

type EntityDetailDialogProps = {
  beats: Beat[];
  characters: DerivedCharacter[];
  characterProfiles: CharacterProfile[];
  locationProfiles: LocationProfile[];
  locations: DerivedLocation[];
  mutationPending: boolean;
  props: Prop[];
  sceneNotes: SceneProductionNote[];
  scenes: DerivedScene[];
  target: EntityDetailTarget | null;
  onClose: () => void;
  onSaveBeat: (input: BeatDetailInput) => void;
  onSaveCharacter: (input: CharacterProfileInput) => void;
  onSaveLocation: (input: LocationProfileInput) => void;
  onSaveProp: (input: PropDetailInput) => void;
  onSaveScene: (input: SceneProductionNoteInput) => void;
};

const colorOptions = ["racing-green", "slate", "amber", "rose", "violet"];
const genderOptions = ["Not Set", "Male", "Female", "Other"];
const statusOptions = ["Pending", "Scouted", "Approved", "Rejected"];
const generationStatusOptions = ["Pending", "Queued", "Generated", "Approved"];

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function EntityDetailDialog({
  beats,
  characters,
  characterProfiles,
  locationProfiles,
  locations,
  mutationPending,
  props,
  sceneNotes,
  scenes,
  target,
  onClose,
  onSaveBeat,
  onSaveCharacter,
  onSaveLocation,
  onSaveProp,
  onSaveScene,
}: EntityDetailDialogProps) {
  if (!target) return null;

  const submitLabel = mutationPending ? "Saving" : "Save";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (target.kind === "beat") {
      onSaveBeat({
        id: target.id,
        title: formString(formData, "title"),
        description: formString(formData, "description"),
        color: formString(formData, "color") || "racing-green",
        durationMinutes: Number(formString(formData, "durationMinutes")) || 1,
      });
      return;
    }

    if (target.kind === "character") {
      onSaveCharacter({
        characterId: target.id,
        displayName: formString(formData, "displayName"),
        color: formString(formData, "color") || "racing-green",
        gender: formString(formData, "gender") || "Not Set",
        age: formString(formData, "age"),
        role: formString(formData, "role"),
        bio: formString(formData, "bio"),
        appearanceNotes: formString(formData, "appearanceNotes"),
      });
      return;
    }

    if (target.kind === "scene") {
      onSaveScene({
        sceneId: target.id,
        description: formString(formData, "description"),
        artRequirements: formString(formData, "artRequirements"),
        stillStatus: formString(formData, "stillStatus") || "Pending",
        videoStatus: formString(formData, "videoStatus") || "Pending",
      });
      return;
    }

    if (target.kind === "location") {
      onSaveLocation({
        locationId: target.id,
        displayName: formString(formData, "displayName"),
        address: formString(formData, "address"),
        description: formString(formData, "description"),
        scoutingStatus: formString(formData, "scoutingStatus") || "Pending",
        ownerName: formString(formData, "ownerName"),
        phone: formString(formData, "phone"),
        email: formString(formData, "email"),
        dailyRental: formString(formData, "dailyRental"),
        deposit: formString(formData, "deposit"),
        currency: formString(formData, "currency") || "USD",
        availableFrom: formString(formData, "availableFrom"),
        availableUntil: formString(formData, "availableUntil"),
        shootingHours: formString(formData, "shootingHours"),
        notes: formString(formData, "notes"),
      });
      return;
    }

    onSaveProp({
      id: target.id,
      name: formString(formData, "name"),
      themeColor: formString(formData, "themeColor") || "racing-green",
      category: formString(formData, "category"),
      description: formString(formData, "description"),
      imageNote: formString(formData, "imageNote"),
    });
  };

  const title = getDialogTitle(target, beats, characters, locations, props, scenes);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#151816]/45 px-4 py-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={handleSubmit}
        className="max-h-[88vh] w-[min(720px,100%)] overflow-hidden rounded-2xl border border-[#d8ded9] bg-[#fcfdfc] shadow-[0_24px_80px_rgb(0_0_0/0.28)]"
      >
        <div className="flex items-center justify-between border-b border-[#e5e8e5] px-5 py-4">
          <div>
            <h2 className="text-[18px] font-medium">{title}</h2>
            <p className="mt-1 text-[12px] text-[#777771]">
              Production metadata is saved separately from screenplay source text.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close detail editor"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="max-h-[calc(88vh-132px)] overflow-y-auto px-5 py-4">
          {target.kind === "beat" ? (
            <BeatFields beat={beats.find((item) => item.id === target.id)} />
          ) : target.kind === "character" ? (
            <CharacterFields
              character={characters.find((item) => item.id === target.id)}
              profile={characterProfiles.find((item) => item.characterId === target.id)}
            />
          ) : target.kind === "scene" ? (
            <SceneFields
              note={sceneNotes.find((item) => item.sceneId === target.id)}
              scene={scenes.find((item) => item.id === target.id)}
            />
          ) : target.kind === "location" ? (
            <LocationFields
              location={locations.find((item) => item.id === target.id)}
              profile={locationProfiles.find((item) => item.locationId === target.id)}
            />
          ) : (
            <PropFields prop={props.find((item) => item.id === target.id)} />
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e5e8e5] px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutationPending}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

function BeatFields({ beat }: { beat?: Beat }) {
  return (
    <FieldGrid>
      <TextField label="Beat Name" name="title" defaultValue={beat?.title ?? ""} />
      <SelectField label="Color" name="color" options={colorOptions} defaultValue={beat?.color} />
      <TextField
        label="Duration"
        name="durationMinutes"
        type="number"
        defaultValue={String(beat?.durationMinutes ?? 8)}
      />
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={beat?.description ?? ""}
      />
    </FieldGrid>
  );
}

function CharacterFields({
  character,
  profile,
}: {
  character?: DerivedCharacter;
  profile?: CharacterProfile;
}) {
  return (
    <FieldGrid>
      <TextField
        label="Name"
        name="displayName"
        defaultValue={profile?.displayName ?? character?.displayName ?? ""}
      />
      <SelectField label="Color" name="color" options={colorOptions} defaultValue={profile?.color} />
      <SelectField
        label="Gender"
        name="gender"
        options={genderOptions}
        defaultValue={profile?.gender ?? "Not Set"}
      />
      <TextField label="Age" name="age" defaultValue={profile?.age ?? ""} />
      <TextField label="Role/Identity" name="role" defaultValue={profile?.role ?? ""} />
      <TextAreaField label="Bio" name="bio" defaultValue={profile?.bio ?? ""} />
      <TextAreaField
        label="Appearance Notes"
        name="appearanceNotes"
        defaultValue={profile?.appearanceNotes ?? ""}
      />
    </FieldGrid>
  );
}

function SceneFields({
  note,
  scene,
}: {
  note?: SceneProductionNote;
  scene?: DerivedScene;
}) {
  return (
    <FieldGrid>
      <ReadOnlyMetric label="Scene" value={scene?.heading ?? "Unknown scene"} />
      <ReadOnlyMetric label="Characters" value={String(scene?.characterIds.length ?? 0)} />
      <ReadOnlyMetric label="Dialogues" value={String(scene?.dialogueLineCount ?? 0)} />
      <SelectField
        label="Still Status"
        name="stillStatus"
        options={generationStatusOptions}
        defaultValue={note?.stillStatus ?? "Pending"}
      />
      <SelectField
        label="Video Status"
        name="videoStatus"
        options={generationStatusOptions}
        defaultValue={note?.videoStatus ?? "Pending"}
      />
      <TextAreaField
        label="Scene Description"
        name="description"
        defaultValue={note?.description ?? ""}
      />
      <TextAreaField
        label="Art Requirements"
        name="artRequirements"
        defaultValue={note?.artRequirements ?? ""}
      />
    </FieldGrid>
  );
}

function LocationFields({
  location,
  profile,
}: {
  location?: DerivedLocation;
  profile?: LocationProfile;
}) {
  return (
    <FieldGrid>
      <TextField
        label="Location Name"
        name="displayName"
        defaultValue={profile?.displayName ?? location?.displayName ?? ""}
      />
      <SelectField
        label="Scouting Status"
        name="scoutingStatus"
        options={statusOptions}
        defaultValue={profile?.scoutingStatus ?? "Pending"}
      />
      <TextField label="Address" name="address" defaultValue={profile?.address ?? ""} />
      <TextField label="Owner / Site Manager" name="ownerName" defaultValue={profile?.ownerName ?? ""} />
      <TextField label="Phone" name="phone" defaultValue={profile?.phone ?? ""} />
      <TextField label="Email" name="email" defaultValue={profile?.email ?? ""} />
      <TextField label="Daily Rental" name="dailyRental" defaultValue={profile?.dailyRental ?? ""} />
      <TextField label="Deposit" name="deposit" defaultValue={profile?.deposit ?? ""} />
      <TextField label="Currency" name="currency" defaultValue={profile?.currency ?? "USD"} />
      <TextField label="Available From" name="availableFrom" defaultValue={profile?.availableFrom ?? ""} />
      <TextField label="Available Until" name="availableUntil" defaultValue={profile?.availableUntil ?? ""} />
      <TextField label="Shooting Hours" name="shootingHours" defaultValue={profile?.shootingHours ?? ""} />
      <TextAreaField label="Description" name="description" defaultValue={profile?.description ?? ""} />
      <TextAreaField label="Notes" name="notes" defaultValue={profile?.notes ?? ""} />
    </FieldGrid>
  );
}

function PropFields({ prop }: { prop?: Prop }) {
  return (
    <FieldGrid>
      <TextField label="Name" name="name" defaultValue={prop?.name ?? ""} />
      <SelectField label="Theme Color" name="themeColor" options={colorOptions} defaultValue={prop?.themeColor} />
      <TextField label="Category" name="category" defaultValue={prop?.category ?? ""} />
      <TextAreaField label="Description" name="description" defaultValue={prop?.description ?? ""} />
      <TextAreaField label="Image Note" name="imageNote" defaultValue={prop?.imageNote ?? ""} />
    </FieldGrid>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">{children}</div>;
}

function TextField({
  defaultValue,
  label,
  name,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-[#5f6762]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-10 rounded-lg border border-[#dce2de] bg-white px-3 text-[14px] font-normal text-[#242421] outline-none focus:ring-2 focus:ring-[#dfe8e2]"
      />
    </label>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-[#5f6762]">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? options[0]}
        className="h-10 rounded-lg border border-[#dce2de] bg-white px-3 text-[14px] font-normal text-[#242421] outline-none focus:ring-2 focus:ring-[#dfe8e2]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  defaultValue,
  label,
  name,
}: {
  defaultValue: string;
  label: string;
  name: string;
}) {
  return (
    <label className="col-span-2 grid gap-1.5 text-[12px] font-medium text-[#5f6762] max-[720px]:col-span-1">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="min-h-24 resize-y rounded-lg border border-[#dce2de] bg-white px-3 py-2 text-[14px] font-normal leading-6 text-[#242421] outline-none focus:ring-2 focus:ring-[#dfe8e2]"
      />
    </label>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e1e6e2] bg-[#f8faf8] px-3 py-2">
      <div className="text-[11px] uppercase tracking-normal text-[#8b8b84]">
        {label}
      </div>
      <div className="mt-1 truncate text-[14px] font-medium text-[#242421]">
        {value}
      </div>
    </div>
  );
}

function getDialogTitle(
  target: EntityDetailTarget,
  beats: Beat[],
  characters: DerivedCharacter[],
  locations: DerivedLocation[],
  props: Prop[],
  scenes: DerivedScene[],
) {
  if (target.kind === "beat") {
    return `Edit Beat: ${beats.find((item) => item.id === target.id)?.title ?? "Beat"}`;
  }
  if (target.kind === "character") {
    return `Edit Character: ${
      characters.find((item) => item.id === target.id)?.displayName ?? "Character"
    }`;
  }
  if (target.kind === "scene") {
    return `Edit Scene: ${scenes.find((item) => item.id === target.id)?.heading ?? "Scene"}`;
  }
  if (target.kind === "location") {
    return `Edit Location: ${
      locations.find((item) => item.id === target.id)?.displayName ?? "Location"
    }`;
  }
  return `Edit Prop: ${props.find((item) => item.id === target.id)?.name ?? "Prop"}`;
}
