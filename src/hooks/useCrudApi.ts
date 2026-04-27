'use client'

import { useState, useCallback, useRef } from 'react'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'

interface PaginationData {
  total: number
  total_pages: number
  current_page: number
  per_page: number
}

interface ListResponse<T> {
  data?: {
    [key: string]: T[] | PaginationData | undefined
    pagination?: PaginationData
  }
}

interface MutationResponse {
  success?: boolean
  message?: string
}

interface ShowResponse {
  data?: Record<string, unknown>
}

interface UseCrudApiOptions {
  /** API base path e.g. '/company' */
  basePath: string
  /** Key in list response e.g. 'companies' */
  listKey: string
  /** Identifier field for delete/show: 'uuid' or 'id' */
  idField?: 'uuid' | 'id'
  /** Extra list params */
  listParams?: Record<string, string>
}

export function useCrudApi<T>({ basePath, listKey, idField = 'uuid', listParams = {} }: UseCrudApiOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')

  const listParamsRef = useRef(listParams)
  listParamsRef.current = listParams

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<ListResponse<T>>(`${basePath}/list`, {
        method: 'GET',
        encrypt: false,
        payload: { page: String(page), per_page: String(perPage), search, status: 'all', ...listParamsRef.current },
      })
      const nested = res.data
      const rows = (nested?.[listKey] as T[] | undefined) ?? []
      const pagination = nested?.pagination as PaginationData | undefined
      setData(rows)
      setTotalCount(pagination?.total ?? rows.length)
      setTotalPages(pagination?.total_pages ?? 1)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [basePath, listKey, page, perPage, search])

  const create = async (payload: Record<string, unknown>): Promise<MutationResponse> => {
    return apiCall<MutationResponse>(`${basePath}/create`, { payload })
  }

  const update = async (payload: Record<string, unknown>): Promise<MutationResponse> => {
    return apiCall<MutationResponse>(`${basePath}/update`, { payload })
  }

  const remove = async (id: string | number): Promise<MutationResponse> => {
    const payload = idField === 'uuid' ? { uuid: id } : { id }
    return apiCall<MutationResponse>(`${basePath}/delete`, { payload })
  }

  const show = async (id: string | number): Promise<Record<string, unknown> | null> => {
    try {
      const payload = idField === 'uuid' ? { uuid: id } : { id: String(id) }
      const res = await apiCall<ShowResponse>(`${basePath}/show`, { method: 'GET', encrypt: false, payload })
      return (res.data ?? res) as Record<string, unknown>
    } catch {
      return null
    }
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  return {
    // List state
    data,
    loading,
    page,
    perPage,
    totalPages,
    totalCount,
    search,

    // List actions
    fetchList,
    setPage,
    setPerPage,
    setSearch: handleSearch,

    // CRUD actions
    create,
    update,
    remove,
    show,
  }
}
