"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from "@/lib/supabase/queries/categories";
import {
  createSubcategory,
  deleteSubcategory,
  listSubcategories,
  updateSubcategory,
  type Subcategory,
} from "@/lib/supabase/queries/subcategories";
import { categorySchema } from "@/lib/validation/category";
import { subcategorySchema } from "@/lib/validation/subcategory";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import { IconPicker } from "@/components/IconPicker";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";

type Tab = "expense" | "income";

const DEFAULT_ICON = "folder";

export function CategoriesManager({
  familyId,
  initialCategories,
  initialSubcategories,
}: {
  familyId: string;
  initialCategories: Category[];
  initialSubcategories: Subcategory[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [tab, setTab] = useState<Tab>("expense");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subName, setSubName] = useState("");
  const [subError, setSubError] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  async function refresh() {
    const supabase = createClient();
    setCategories(await listCategories(supabase));
  }

  async function refreshSubcategories() {
    const supabase = createClient();
    setSubcategories(await listSubcategories(supabase, familyId));
  }

  useRealtimeTable("categories", familyId, refresh);
  useRealtimeTable("subcategories", familyId, refreshSubcategories);

  const filtered = categories.filter((c) => c.type === tab);

  function toggleExpand(categoryId: string) {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
    setAddingSubFor(null);
    setEditingSub(null);
  }

  function openAddSubForm(categoryId: string) {
    setAddingSubFor(categoryId);
    setEditingSub(null);
    setSubName("");
    setSubError(null);
  }

  function openEditSubForm(s: Subcategory) {
    setEditingSub(s);
    setAddingSubFor(null);
    setSubName(s.name);
    setSubError(null);
  }

  function closeSubForm() {
    setAddingSubFor(null);
    setEditingSub(null);
    setSubError(null);
  }

  async function handleSubSubmit(e: React.FormEvent, categoryId: string) {
    e.preventDefault();
    const result = subcategorySchema.safeParse({ category_id: categoryId, name: subName });
    if (!result.success) {
      setSubError(result.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    setSubError(null);
    setSubLoading(true);
    try {
      const supabase = createClient();
      if (editingSub) {
        await updateSubcategory(supabase, editingSub.id, result.data.name);
      } else {
        await createSubcategory(supabase, familyId, categoryId, result.data.name);
      }
      await refreshSubcategories();
      closeSubForm();
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Gagal menyimpan sub kategori.");
    } finally {
      setSubLoading(false);
    }
  }

  async function handleDeleteSub(s: Subcategory) {
    if (!confirm(`Hapus sub kategori "${s.name}"?`)) return;
    try {
      const supabase = createClient();
      await deleteSubcategory(supabase, s.id);
      await refreshSubcategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus sub kategori.");
    }
  }

  function openCreateForm() {
    setEditing(null);
    setName("");
    setIcon(DEFAULT_ICON);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(c: Category) {
    setEditing(c);
    setName(c.name);
    setIcon(c.icon ?? DEFAULT_ICON);
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = categorySchema.safeParse({ name, type: tab, icon });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (editing) {
        await updateCategory(supabase, editing.id, {
          name: result.data.name,
          icon: result.data.icon,
        });
      } else {
        await createCategory(supabase, familyId, result.data);
      }
      await refresh();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kategori.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Hapus kategori "${c.name}"?`)) return;
    try {
      const supabase = createClient();
      await deleteCategory(supabase, c.id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href="/more"
          className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary shrink-0"
          aria-label="Kembali"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary">Kelola Kategori</h1>
      </div>

      <div className="flex rounded-xl bg-bg-surface border border-border-subtle p-1">
        {(["expense", "income"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              closeForm();
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-medium ${
              tab === t ? "bg-accent text-white" : "text-text-secondary"
            }`}
          >
            {t === "expense" ? "Pengeluaran" : "Pemasukan"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-text-muted text-center mt-6">Belum ada kategori.</p>
        )}
        {filtered.map((c) => {
          const expanded = expandedCategoryId === c.id;
          const categorySubs = subcategories.filter((s) => s.categoryId === c.id);
          return (
            <div
              key={c.id}
              className="rounded-xl bg-bg-surface border border-border-subtle p-3 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <CategoryIcon name={c.name} icon={c.icon} />
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                  {c.isDefault && (
                    <span className="text-[10px] text-text-muted shrink-0">Bawaan</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditForm(c)}
                    aria-label={`Ubah ${c.name}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  {!c.isDefault && (
                    <button
                      onClick={() => handleDelete(c)}
                      aria-label={`Hapus ${c.name}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-danger"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(c.id)}
                    aria-label={expanded ? `Tutup sub kategori ${c.name}` : `Lihat sub kategori ${c.name}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
                  >
                    <ChevronRightIcon
                      className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="pl-11 flex flex-col gap-2 border-t border-border-subtle pt-3">
                  {categorySubs.length === 0 && !addingSubFor && (
                    <p className="text-xs text-text-muted">Belum ada sub kategori.</p>
                  )}

                  {categorySubs.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <p className="flex-1 min-w-0 text-sm text-text-secondary truncate">
                        {s.name}
                      </p>
                      <button
                        onClick={() => openEditSubForm(s)}
                        aria-label={`Ubah ${s.name}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary shrink-0"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSub(s)}
                        aria-label={`Hapus ${s.name}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-danger shrink-0"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(addingSubFor === c.id || editingSub?.categoryId === c.id) && (
                    <form
                      onSubmit={(e) => handleSubSubmit(e, c.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        className="input flex-1 text-sm"
                        placeholder="mis. Bensin"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={subLoading}
                        className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={closeSubForm}
                        className="rounded-lg border border-border-subtle px-3 py-2 text-xs text-text-secondary"
                      >
                        Batal
                      </button>
                    </form>
                  )}
                  {subError && <p className="text-xs text-danger">{subError}</p>}

                  {addingSubFor !== c.id && editingSub?.categoryId !== c.id && (
                    <button
                      onClick={() => openAddSubForm(c.id)}
                      className="text-xs text-accent text-left"
                    >
                      + Tambah Sub Kategori
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex flex-col gap-4"
        >
          <h2 className="text-lg font-medium text-text-primary">
            {editing
              ? "Ubah kategori"
              : `Tambah kategori ${tab === "expense" ? "pengeluaran" : "pemasukan"}`}
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-secondary">Nama kategori</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-secondary">Ikon</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 rounded-xl border border-border-subtle py-3 text-text-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-accent py-3 text-white font-medium"
        >
          + Tambah Kategori
        </button>
      )}
    </div>
  );
}
