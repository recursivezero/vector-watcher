import type { LanceSortColumn, LanceSortOrder } from "@/api/lance";
import { type FormEvent, useState } from "react";

interface LanceFilterBarProps {
  appliedTag: string;
  sortBy: LanceSortColumn | null;
  sortOrder: LanceSortOrder;
  pageSize: number;
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onTagApply: (tag: string) => void;
  onSortChange: (column: LanceSortColumn | null, order: LanceSortOrder) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function LanceFilterBar({
  appliedTag,
  sortBy,
  sortOrder,
  pageSize,
  loading,
  search,
  onSearchChange,
  onTagApply,
  onSortChange,
  onPageSizeChange
}: LanceFilterBarProps) {
  const [tagInput, setTagInput] = useState(appliedTag);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onTagApply(tagInput);
  };

  return (
    <section className="lance-admin-filter" aria-label="Row filtering and sorting">
      <label className="lance-admin-field lance-admin-field--search">
        <span>Search</span>
        <input
          type="search"
          value={search}
          maxLength={256}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search image URI, tag or hash"
          disabled={loading}
        />
      </label>

      <form className="lance-admin-filter__tag" onSubmit={submit}>
        <label className="lance-admin-field lance-admin-filter__tag-input">
          <span>Exact tag filter</span>
          <input
            type="search"
            value={tagInput}
            maxLength={128}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="e.g. product"
            disabled={loading}
          />
        </label>

        <div className="lance-admin-filter__tag-actions">
          <span className="lance-admin-filter__action-label" aria-hidden="true">
            Action
          </span>

          <div className="lance-admin-filter__tag-buttons">
            <button type="submit" className="lance-admin-button" disabled={loading}>
              Apply
            </button>

            {(appliedTag || tagInput) && (
              <button
                type="button"
                className="lance-admin-button lance-admin-button--quiet"
                onClick={() => {
                  setTagInput("");
                  onTagApply("");
                }}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      <label className="lance-admin-field">
        <span>Sort column</span>
        <select
          value={sortBy ?? ""}
          onChange={(event) => onSortChange((event.target.value || null) as LanceSortColumn | null, sortOrder)}
          disabled={loading}
        >
          <option value="">Default order</option>
          <option value="image_uri">Image URI</option>
          <option value="tag">Tag</option>
          <option value="hash">Hash</option>
          <option value="mtime">Modified time</option>
        </select>
      </label>

      <label className="lance-admin-field">
        <span>Direction</span>
        <select
          value={sortOrder}
          onChange={(event) => onSortChange(sortBy, event.target.value as LanceSortOrder)}
          disabled={loading || !sortBy}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>

      <label className="lance-admin-field">
        <span>Rows per page</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} disabled={loading}>
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
