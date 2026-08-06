"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateDocumentCategoryForm } from "@/app/dashboard/documents/create-document-category-form";
import { updateDocumentCategoryAction } from "@/features/documents/lib/update-document-category";
import { deleteDocumentCategoryAction } from "@/features/documents/lib/delete-document-category";
import {
  initialDocumentCategoryDeleteState,
  initialDocumentCategoryUpdateState,
} from "@/features/documents/lib/documents.shared";
import type { DocumentCategoryItem } from "@/features/documents/queries/document-categories";

function EditSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

function DeleteSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending || disabled}
      className="h-9 w-9 rounded-xl p-0 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
      aria-label="Delete category"
      title={
        disabled
          ? "Reassign or archive documents before deleting"
          : pending
            ? "Deleting..."
            : "Delete category"
      }
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function CategoryEditForm({
  category,
  onCancel,
  onSaved,
}: {
  category: DocumentCategoryItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [updateState, updateAction] = useActionState(
    updateDocumentCategoryAction,
    initialDocumentCategoryUpdateState,
  );

  useEffect(() => {
    if (!updateState.ok) return;
    router.refresh();
    onSaved();
  }, [onSaved, router, updateState.ok]);

  const values = updateState.values?.categoryId
    ? updateState.values
    : {
        categoryId: category.id,
        name: category.name,
        description: category.description ?? "",
      };
  const fieldErrors = updateState.fieldErrors ?? {};

  return (
    <li className="rounded-xl border border-[#c7ddea] bg-[#fbfdff] px-4 py-4">
      <form action={updateAction} className="space-y-3">
        <input type="hidden" name="categoryId" value={category.id} />
        <Field>
          <FieldLabel htmlFor={`category-name-${category.id}`} required>
            Name
          </FieldLabel>
          <Input
            id={`category-name-${category.id}`}
            name="name"
            defaultValue={values.name}
          />
          <FieldError>{fieldErrors.name?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor={`category-description-${category.id}`}>
            Description
          </FieldLabel>
          <Textarea
            id={`category-description-${category.id}`}
            name="description"
            rows={2}
            defaultValue={values.description}
          />
          <FieldError>{fieldErrors.description?.[0]}</FieldError>
        </Field>
        {updateState.message && !updateState.ok ? (
          <p className="text-xs text-rose-600">{updateState.message}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <EditSubmitButton />
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </li>
  );
}

function CategoryRow({ category }: { category: DocumentCategoryItem }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteState, deleteAction] = useActionState(
    deleteDocumentCategoryAction,
    initialDocumentCategoryDeleteState,
  );

  useEffect(() => {
    if (!deleteState.ok) return;
    router.refresh();
  }, [deleteState.ok, router]);

  const hasDocuments = category._count.documents > 0;

  if (isEditing) {
    return (
      <CategoryEditForm
        category={category}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900">{category.name}</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {category._count.documents}{" "}
            {category._count.documents === 1 ? "document" : "documents"}
          </span>
        </div>
        {category.description ? (
          <p className="mt-1 text-sm text-slate-500">{category.description}</p>
        ) : null}
        {deleteState.message && !deleteState.ok ? (
          <p className="mt-2 text-xs text-rose-600">{deleteState.message}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 rounded-xl p-0"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${category.name}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                `Delete category "${category.name}"? This cannot be undone.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="categoryId" value={category.id} />
          <DeleteSubmitButton disabled={hasDocuments} />
        </form>
      </div>
    </li>
  );
}

export function ManageDocumentCategories({
  categories,
}: {
  categories: DocumentCategoryItem[];
}) {
  return (
    <div className="space-y-6">
      {categories.length > 0 ? (
        <ul className="space-y-2">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No document categories have been created yet.
        </p>
      )}

      <div className="border-t border-slate-200 pt-5">
        <p className="mb-3 text-sm font-semibold text-slate-950">
          Add a new category
        </p>
        <CreateDocumentCategoryForm mode="dialog" />
      </div>
    </div>
  );
}
