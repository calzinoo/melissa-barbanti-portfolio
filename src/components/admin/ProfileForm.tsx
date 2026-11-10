"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveProfileAction } from "@/app/admin/content-actions";
import { Field, FormActions, cardCls, inputCls, textareaCls } from "./FormUi";
import ImageUploader from "./ImageUploader";
import ProfilePreview from "./ProfilePreview";

export type ProfileFormValues = {
  avatarUrl: string;
  bioDescription: string;
  profileImages: string[];
  instagramUrl: string;
  email: string;
};

export default function ProfileForm({ initial }: { initial: ProfileFormValues }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProfileFormValues>(k: K, val: ProfileFormValues[K]) => {
    setSaved(false);
    setV((s) => ({ ...s, [k]: val }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        const res = await saveProfileAction({
          ...v,
          avatarUrl: v.avatarUrl || null,
          instagramUrl: v.instagramUrl || null,
          email: v.email || null,
        });
        setErrors(res.ok ? {} : res.errors);
        setSaved(res.ok);
      } catch {
        setErrors({ _form: "Salvataggio non riuscito. Riprova." });
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-8 2xl:grid-cols-2">
      <div className="space-y-6">
        <div className={cardCls}>
          <ImageUploader
            label="Ritratto dell'artista"
            value={v.avatarUrl ? [v.avatarUrl] : []}
            onChange={(u) => set("avatarUrl", u[0] ?? "")}
          />
        </div>
        <div className={cardCls}>
          <Field
            label="Biografia"
            htmlFor="bio"
            error={errors.bioDescription}
            hint="Separa i paragrafi con una riga vuota."
          >
            <textarea id="bio" rows={12} className={textareaCls} value={v.bioDescription} onChange={(e) => set("bioDescription", e.target.value)} />
          </Field>
          <div className="mt-6">
            <ImageUploader
              multiple
              hideBadge
              label="Foto dello studio / atelier"
              value={v.profileImages}
              onChange={(u) => set("profileImages", u)}
            />
          </div>
        </div>
        <div className={`${cardCls} grid gap-5 sm:grid-cols-2`}>
          <Field label="Instagram (URL)" htmlFor="ig" error={errors.instagramUrl}>
            <input id="ig" type="url" placeholder="https://www.instagram.com/…" className={inputCls} value={v.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
          </Field>
          <Field label="Email di contatto" htmlFor="email" error={errors.email}>
            <input id="email" type="email" className={inputCls} value={v.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </div>
        <FormActions pending={pending} error={errors._form} label="Salva profilo" />
        {saved && (
          <p role="status" className="inline-flex items-center gap-2 text-sm text-green-800">
            <Check size={16} /> Profilo salvato e sito aggiornato.
          </p>
        )}
      </div>

      <aside className="2xl:sticky 2xl:top-6 2xl:self-start">
        <ProfilePreview text={v.bioDescription} images={v.profileImages} />
      </aside>
    </form>
  );
}
