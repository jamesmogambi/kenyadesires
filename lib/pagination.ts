// lib/pagination.ts
export const ITEMS_PER_PAGE = 24; // or 20, depending on your preference

export interface PaginationResult<T> {
    items: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export function paginate<T>(
    items: T[],
    page: number = 1,
    limit: number = ITEMS_PER_PAGE,
): PaginationResult<T> {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    const totalPages = Math.ceil(items.length / limit);

    return {
        items: paginatedItems,
        currentPage: page,
        totalPages,
        totalItems: items.length,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}
