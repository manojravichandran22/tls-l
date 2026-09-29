'use client'

import { useState } from 'react'
import type { ToastData } from '@/components/ui/Toast'

export function useMasterPage<T>() {
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<T | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const openAdd = () => { setEditItem(null); setShowModal(true) }
  const openEdit = (item: T) => { setEditItem(item); setShowModal(true) }
  const closeModal = () => setShowModal(false)

  const showSuccess = (msg: string) => setToast({ message: msg, type: 'success' })
  const showError = (msg: string) => setToast({ message: msg, type: 'error' })
  const clearToast = () => setToast(null)

  const startView = () => { setViewLoading(true); setViewData({}) }
  const setView = (data: Record<string, unknown> | null) => { setViewData(data); setViewLoading(false) }
  const closeView = () => setViewData(null)

  return {
    // Modal
    showModal,
    editItem,
    openAdd,
    openEdit,
    closeModal,

    // Delete
    deleteTarget,
    setDeleteTarget,
    deleting,
    setDeleting,

    // Toast
    toast,
    showSuccess,
    showError,
    clearToast,

    // View
    viewData,
    viewLoading,
    startView,
    setView,
    closeView,
  }
}
