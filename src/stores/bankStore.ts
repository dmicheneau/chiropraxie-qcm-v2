import { create } from 'zustand'
import type { QuestionBank, Question, QuestionSource } from '@/types'
import { db } from '@/services/db'
import { generateUUID } from '@/utils'
import { createDefaultQuestionBank } from '@/data/defaultBank'

interface BankState {
  banks: QuestionBank[]
  currentBankId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  loadBanks: () => Promise<void>
  createBank: (name: string, description: string) => Promise<QuestionBank>
  deleteBank: (bankId: string) => Promise<void>
  addQuestionsToBank: (bankId: string, questions: Question[]) => Promise<void>
  removeQuestionFromBank: (bankId: string, questionId: string) => Promise<void>
  updateQuestion: (bankId: string, questionId: string, updates: Partial<Question>) => Promise<void>
  setCurrentBank: (bankId: string | null) => void
  getBank: (bankId: string) => QuestionBank | undefined
  getAllQuestions: () => Question[]
  getQuestionsByTheme: (theme: string) => Question[]
}

export const useBankStore = create<BankState>()((set, get) => ({
  banks: [],
  currentBankId: null,
  isLoading: false,
  error: null,

  loadBanks: async () => {
    set({ isLoading: true, error: null })
    try {
      let banks = await db.banks.toArray()
      
      // If no banks exist, create the default bank
      if (banks.length === 0) {
        const defaultBank = createDefaultQuestionBank()
        await db.banks.add(defaultBank)
        banks = [defaultBank]
      }

      set({ banks, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur de chargement des banques',
        isLoading: false 
      })
    }
  },

  createBank: async (name: string, description: string) => {
    const now = new Date().toISOString()
    const newBank: QuestionBank = {
      id: generateUUID(),
      name,
      description,
      questions: [],
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      metadata: {
        totalQuestions: 0,
        themes: [],
        sources: {} as Record<QuestionSource, number>
      }
    }

    await db.banks.add(newBank)
    set(state => ({ banks: [...state.banks, newBank] }))
    return newBank
  },

  deleteBank: async (bankId: string) => {
    const bank = get().banks.find(b => b.id === bankId)
    if (bank?.isDefault) {
      throw new Error('Impossible de supprimer la banque par défaut')
    }

    await db.banks.delete(bankId)
    set(state => ({
      banks: state.banks.filter(b => b.id !== bankId),
      currentBankId: state.currentBankId === bankId ? null : state.currentBankId
    }))
  },

  addQuestionsToBank: async (bankId: string, questions: Question[]) => {
    const bank = get().banks.find(b => b.id === bankId)
    if (!bank) {
      throw new Error('Banque non trouvée')
    }

    const updatedQuestions = [...bank.questions, ...questions]
    const themes = [...new Set(updatedQuestions.map(q => q.theme))]
    const sources = updatedQuestions.reduce((acc, q) => {
      acc[q.source] = (acc[q.source] || 0) + 1
      return acc
    }, {} as Record<QuestionSource, number>)

    const updatedBank: QuestionBank = {
      ...bank,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
      metadata: {
        totalQuestions: updatedQuestions.length,
        themes,
        sources
      }
    }

    await db.banks.put(updatedBank)
    set(state => ({
      banks: state.banks.map(b => b.id === bankId ? updatedBank : b)
    }))
  },

  removeQuestionFromBank: async (bankId: string, questionId: string) => {
    const bank = get().banks.find(b => b.id === bankId)
    if (!bank) {
      throw new Error('Banque non trouvée')
    }

    const updatedQuestions = bank.questions.filter(q => q.id !== questionId)
    const themes = [...new Set(updatedQuestions.map(q => q.theme))]
    const sources = updatedQuestions.reduce((acc, q) => {
      acc[q.source] = (acc[q.source] || 0) + 1
      return acc
    }, {} as Record<QuestionSource, number>)

    const updatedBank: QuestionBank = {
      ...bank,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
      metadata: {
        totalQuestions: updatedQuestions.length,
        themes,
        sources
      }
    }

    await db.banks.put(updatedBank)
    set(state => ({
      banks: state.banks.map(b => b.id === bankId ? updatedBank : b)
    }))
  },

  updateQuestion: async (bankId: string, questionId: string, updates: Partial<Question>) => {
    const bank = get().banks.find(b => b.id === bankId)
    if (!bank) {
      throw new Error('Banque non trouvée')
    }

    const updatedQuestions = bank.questions.map(q =>
      q.id === questionId ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
    )

    const themes = [...new Set(updatedQuestions.map(q => q.theme))]

    const updatedBank: QuestionBank = {
      ...bank,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...bank.metadata,
        themes
      }
    }

    await db.banks.put(updatedBank)
    set(state => ({
      banks: state.banks.map(b => b.id === bankId ? updatedBank : b)
    }))
  },

  setCurrentBank: (bankId: string | null) => {
    set({ currentBankId: bankId })
  },

  getBank: (bankId: string) => {
    return get().banks.find(b => b.id === bankId)
  },

  getAllQuestions: () => {
    return get().banks.flatMap(b => b.questions)
  },

  getQuestionsByTheme: (theme: string) => {
    return get().getAllQuestions().filter(q => q.theme === theme)
  }
}))
