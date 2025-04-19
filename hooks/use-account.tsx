"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AccountContextType {
  address: string
  isConnected: boolean
  setAddress: (address: string) => void
}

const AccountContext = createContext<AccountContextType>({
  address: "",
  isConnected: false,
  setAddress: () => {},
})

export function AccountProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>("")

  // Check if there's a stored address in localStorage on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress")
    if (storedAddress) {
      setAddress(storedAddress)
    }
  }, [])

  // Store address in localStorage when it changes
  useEffect(() => {
    if (address) {
      localStorage.setItem("walletAddress", address)
    } else {
      localStorage.removeItem("walletAddress")
    }
  }, [address])

  return (
    <AccountContext.Provider
      value={{
        address,
        isConnected: !!address,
        setAddress,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  return useContext(AccountContext)
}

