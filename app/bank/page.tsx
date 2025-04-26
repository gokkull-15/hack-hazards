"use client"
import "./styles.css"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Edit3, ExternalLink, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAccount } from "@/hooks/use-account"
import { TransactionDefault } from "@coinbase/onchainkit/transaction"
import { parseEther } from "viem"

// Constants
const BASE_SEPOLIA_CHAIN_ID = 84532

export default function TwitchStreamPage() {
  const [tipAmount, setTipAmount] = useState("0.01")
  const [customAmount, setCustomAmount] = useState("")
  const [isCustomAmount, setIsCustomAmount] = useState(false)
  const [message, setMessage] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [showTipOverlay, setShowTipOverlay] = useState(false)
  const [tipOverlayData, setTipOverlayData] = useState<{
    from: string
    amount: string
    message: string
    timestamp: string
    txHash: string
  } | null>(null)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const { toast } = useToast()
  const { address } = useAccount()

  // Validate Ethereum address
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)

  // Cleanup timeout for tip overlay
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (showTipOverlay) {
      timer = setTimeout(() => {
        setShowTipOverlay(false)
      }, 5000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showTipOverlay])

  useEffect(() => {
    if (!isCustomAmount) {
      setCustomAmount("")
    }
  }, [isCustomAmount])

  const handleSelectPresetAmount = useCallback((amount: string) => {
    setTipAmount(amount)
    setIsCustomAmount(false)
  }, [])

  const handleCustomAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value)
      if (value && Number(value) > 0) {
        setIsCustomAmount(true)
      }
    }
  }, [])

  const handleRecipientAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(e.target.value)
  }, [])

  const handleTipSuccess = useCallback((txHash: string) => {
    setLastTxHash(txHash)

    setTipOverlayData({
      from: address || "Anonymous",
      amount: isCustomAmount && customAmount ? customAmount : tipAmount,
      message: message || "Thanks for the stream!",
      timestamp: new Date().toISOString(),
      txHash,
    })
    setShowTipOverlay(true)

    toast({
      title: "Tip sent!",
      description: (
        <div className="flex flex-col gap-1">
          <span>
            You tipped {isCustomAmount && customAmount ? customAmount : tipAmount} ETH
          </span>
          <a
            href={`https://sepolia-explorer.base.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View transaction
          </a>
        </div>
      ),
    })

    setMessage("")
    if (isCustomAmount) {
      setCustomAmount("")
      setIsCustomAmount(false)
      setTipAmount("0.01")
    }
  }, [address, customAmount, isCustomAmount, message, tipAmount, toast])

  const actualAmount = isCustomAmount && customAmount ? customAmount : tipAmount

  const handleStatus = useCallback(
    (status: any) => {
      console.log("Transaction status:", status.statusName)
      if (status.statusName === "preparing") {
        setIsSending(true)
      } else if (status.statusName === "rejected" || status.statusName === "failed") {
        setIsSending(false)
        toast({
          title: "Transaction failed",
          description: "Your tip could not be processed. Please try again.",
          variant: "destructive",
        })
      } else if (
        status.statusName === "success" &&
        status.statusData.transactionReceipts?.length > 0
      ) {
        setIsSending(false)
        const txHash = status.statusData.transactionReceipts[0].transactionHash
        setTimeout(() => {
          handleTipSuccess(txHash)
        }, 0)
      }
    },
    [toast, handleTipSuccess]
  )

  const calls = recipientAddress && isValidAddress(recipientAddress) ? [
    {
      to: recipientAddress,
      value: parseEther(actualAmount),
      data: message
        ? `0x${Buffer.from(message || `Tip`, "utf8").toString("hex")}`
        : "0x",
    },
  ] : []

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6 bg-white dark:bg-gray-800 shadow-lg">
      <CardContent className="space-y-6 p-6">
        {showTipOverlay && tipOverlayData && (
          <div className="relative w-full bg-black rounded-lg overflow-hidden mb-4">
            <div className="w-full bg-black/80 text-white p-4 rounded-lg border border-blue-500 animate-slide-down">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {address?.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xl flex items-center gap-2">
                    <span>
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <span className="text-blue-400">tipped {tipOverlayData.amount} ETH</span>
                  </div>
                  <div className="text-sm opacity-80 mt-1">{tipOverlayData.message}</div>
                  <a
                    href={`https://sepolia-explorer.base.org/tx/${tipOverlayData.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs flex items-center gap-1 text-blue-500 hover:underline mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View transaction
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recipient Wallet Address
          </label>
          <Input
            placeholder="Enter recipient's wallet address (0x...)"
            value={recipientAddress}
            onChange={handleRecipientAddressChange}
            className="w-full"
          />
          {recipientAddress && !isValidAddress(recipientAddress) && (
            <p className="text-xs text-red-500 mt-1">Please enter a valid Ethereum address</p>
          )}
          {recipientAddress && isValidAddress(recipientAddress) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sending to: {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
            </p>
          )}
        </div>

        {/* Tip Options */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["0.01", "0.05", "0.1", "0.5", "1"].map((amount) => (
              <Button
                key={amount}
                variant={!isCustomAmount && tipAmount === amount ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectPresetAmount(amount)}
                className="transition-all duration-200"
              >
                {amount} ETH
              </Button>
            ))}
            <Button
              variant={isCustomAmount ? "default" : "outline"}
              size="sm"
              onClick={() => setIsCustomAmount(true)}
              className="flex items-center gap-1 transition-all duration-200"
            >
              <Edit3 className="h-3 w-3" />
              Custom
            </Button>
          </div>

          {isCustomAmount && (
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder="Enter amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="max-w-[150px]"
                autoFocus
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ETH</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            className="w-full"
          />
          <div className="text-xs text-right text-gray-500 dark:text-gray-400">
            {message.length}/200 characters
          </div>

          <div className="flex justify-end">
            <TransactionDefault
              chainId={BASE_SEPOLIA_CHAIN_ID}
              calls={calls}
              onStatus={handleStatus}
              buttonClassName="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all duration-200"
              buttonDisabled={isSending || !isValidAddress(recipientAddress)}
              buttonText={isSending ? "Sending..." : "Send Tip"}
              buttonIcon={<Send className="h-4 w-4" />}
            />
          </div>
        </div>

        {lastTxHash && (
          <div className="mt-4 text-xs">
            <a
              href={`https://sepolia-explorer.base.org/tx/${lastTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View last transaction
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-gray-500 dark:text-gray-400 p-6 pt-0">
        Tips are sent directly to the recipient's wallet.
      </CardFooter>
    </Card>
  )
}