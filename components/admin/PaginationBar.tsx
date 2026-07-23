'use client';

import Button from '../../components/ui/Button';
import { PaginationInfo } from '../../types/pagination';
import { useMemo } from 'react';

interface PaginationBarProps {
  entityLabel: string;
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZES = [10, 25, 50];

const getPageList = (current: number, total: number): number[] => {
  const pages = new Set<number>();
  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page > 0 && page <= total) {
      pages.add(page);
    }
  }
  pages.add(1);
  pages.add(total);
  return Array.from(pages).sort((a, b) => a - b);
};

export default function PaginationBar({
  entityLabel,
  pagination,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationBarProps): React.ReactElement | null {
  const safeTotalPages = Math.max(1, pagination.totalPages || 1);
  const hasMultiplePages = safeTotalPages > 1;
  const allowPageSizeChange = Boolean(onPageSizeChange);

  if (!hasMultiplePages && !allowPageSizeChange) {
    return null;
  }

  const itemsPerPage = pagination.itemsPerPage || pageSizeOptions[0];
  const showingStart = pagination.totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingEnd = Math.min(currentPage * itemsPerPage, pagination.totalItems);

  const pageList = useMemo(() => getPageList(currentPage, safeTotalPages), [currentPage, safeTotalPages]);

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {allowPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            className="rounded-lg border px-2 py-1 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Showing {showingStart} to {showingEnd} of {pagination.totalItems} {entityLabel}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {pageList.map((page, index) => (
            <div key={page} className="flex items-center gap-1">
              {index > 0 && pageList[index - 1] !== page - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <Button
                variant={currentPage === page ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}


