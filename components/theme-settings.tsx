"use client";

import { useState } from "react";

const STORAGE_KEY = "desertarians-color-scheme";

const schemes = [
  { id: "light", name: "White", description: "White background with black text." },
  { id: "enfitek", name: "ENFITEK", description: "ENFITEK blue background with white text." },
  { id: "dark", name: "Dark", description: "Dark background with white text." },
] as const;

type ColorScheme = (typeof schemes)[number]["id"];

function isColorScheme(value: string | null): value is ColorScheme {
  return schemes.some((scheme) => scheme.id === value);
}

function applyScheme(scheme: ColorScheme) {
  if (scheme === "light") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = scheme;
  }
  localStorage.setItem(STORAGE_KEY, scheme);
}

export function ThemeSettings() {
  const [scheme, setScheme] = useState<ColorScheme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem(STORAGE_KEY);
    return isColorScheme(saved) ? saved : "light";
  });

  return (
    <fieldset className="space-y-4">
      <legend className="text-xl font-semibold">Page colors</legend>
      <p className="text-desert-muted text-sm">
        Choose a color scheme. Your selection is saved on this device. Links remain red in every scheme.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {schemes.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer gap-3 rounded-lg border border-desert-border bg-desert-card p-4"
          >
            <input
              type="radio"
              name="color-scheme"
              value={option.id}
              checked={scheme === option.id}
              suppressHydrationWarning
              onChange={() => {
                setScheme(option.id);
                applyScheme(option.id);
              }}
            />
            <span>
              <span className="block font-semibold">{option.name}</span>
              <span className="block text-sm text-desert-muted">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
