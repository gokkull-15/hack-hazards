import type { ReactNode } from "react"

import { Inter } from "next/font/google"

import "@coinbase/onchainkit/styles.css" // Add OnchainKit styles

import { Providers } from "@/app/bank/providers"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
       
          <Providers>
           
              {children}
             
           
          </Providers>
     
      </body>
    </html>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };