'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface WalletInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSubmit?: (address: string) => void
}

export function WalletInput({ value, onChange, placeholder, onSubmit }: WalletInputProps) {
  const [isValid, setIsValid] = useState(true)

  const validateAddress = (address: string) => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    return ethAddressRegex.test(address)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (newValue && !validateAddress(newValue)) {
      setIsValid(false)
    } else {
      setIsValid(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value && validateAddress(value) && onSubmit) {
      onSubmit(value)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder || "Enter Ethereum wallet address (0x...)"}
          className={`block w-full pl-10 pr-12 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            !isValid && value
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        />
        {onSubmit && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="submit"
              disabled={!value || !isValid}
              className="mr-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Analyze
            </button>
          </div>
        )}
      </div>
      
      {!isValid && value && (
        <p className="mt-2 text-sm text-red-600">
          Please enter a valid Ethereum address (42 characters starting with 0x)
        </p>
      )}
      
      <div className="mt-3 text-sm text-gray-500">
        <p>
          Enter any Ethereum wallet address to get an AI-powered trust score based on onchain activity, 
          transaction patterns, and optional offchain signals.
        </p>
      </div>
    </form>
  )
}
