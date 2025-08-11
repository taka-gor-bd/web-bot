"use client"

import { Poppins } from "next/font/google"
import HeaderGlass from "@/components/header"
import { TelegramProvider } from "@/components/telegram-provider"
import { GlassCard } from "@/components/glass-card"
import BottomNav from "@/components/bottom-nav"
import { AdSdkLoader } from "@/components/ad-sdk"
import { usePoints } from "@/lib/use-points"
import { calculateUserAdRewardPts } from "@/lib/config"
import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] })

declare global {
  interface Window {
    show_9696042?: (format: string) => Promise<unknown>
  }
}

export default function HomePage() {
  return (
    <TelegramProvider>
      <main className={poppins.className}>
        <Background />
        <div className="relative mx-auto max-w-md min-h-screen px-4 pb-28 pt-4 text-white">
          <HeaderGlass title="Telegram WebApp" />

          <section className="mt-4">
            <BalanceSection />
          </section>

          <section className="mt-4">
            <AdsSection />
          </section>
        </div>
        <BottomNav />
        <Toaster />
      </main>
    </TelegramProvider>
  )
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <img src="/images/bg.png" alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
    </div>
  )
}

function BalanceSection() {
  const { points, dollars } = usePoints()
  return (
    <GlassCard className="p-5">
      <div className="text-sm text-white/80">Balance</div>
      <div className="mt-1 text-4xl font-bold tracking-tight">
        {points.toLocaleString()} <span className="text-xl font-semibold">pts</span>
      </div>
      <div className="mt-1 text-sm text-white/80">{`$${dollars.toFixed(2)} USD`}</div>
    </GlassCard>
  )
}

function AdsSection() {
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)
  const { toast } = useToast()

  const { adsWatched, adsToday, dailyLimit, canStartAd, markAdStart, rewardAfterAdCompletion, cooldownLeftSeconds } =
    usePoints()

  const rewardPreview = calculateUserAdRewardPts()

  useEffect(() => {
    setSdkReady(typeof window !== "undefined" && typeof window.show_9696042 === "function")
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  async function onWatchAd() {
    if (!window.show_9696042) {
      toast({ title: "Ad not ready", description: "Please try again in a few seconds." })
      return
    }
    const check = canStartAd()
    if (!check.ok) {
      toast({ title: "Please wait", description: check.reason || "Try later." })
      return
    }
    try {
      setLoading(true)
      markAdStart()
      await window.show_9696042("pop") // only rewards if resolves
      const gained = rewardAfterAdCompletion()
      toast({ title: "Reward added", description: `+${gained} pts` })
    } catch (_e) {
      toast({ title: "Ad not completed", description: "No reward granted this time." })
    } finally {
      setLoading(false)
    }
  }

  const remaining = Math.max(0, dailyLimit - adsToday)
  const cdLeft = cooldownLeftSeconds()

  return (
    <GlassCard className="p-5">
      <AdSdkLoader onReady={() => setSdkReady(true)} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/80">Total Ads Watched</div>
          <div className="text-2xl font-semibold">{adsWatched}</div>
          <div className="mt-1 text-xs text-white/70">
            Daily left: {remaining}/{dailyLimit} • Cooldown: {cdLeft}s
          </div>
          <div className="mt-1 text-xs text-white/70">Reward per full ad: +{rewardPreview} pts</div>
        </div>
        <button
          onClick={onWatchAd}
          disabled={!sdkReady || loading || remaining <= 0 || cdLeft > 0}
          className="rounded-full px-5 py-3 text-white disabled:opacity-60"
          style={{ backgroundColor: "#1DA1F2" }}
          title={remaining <= 0 ? "Daily limit reached" : cdLeft > 0 ? `Wait ${cdLeft}s` : "Watch a rewarded ad"}
        >
          {loading ? "Loading..." : !sdkReady ? "Preparing..." : cdLeft > 0 ? `Wait ${cdLeft}s` : "Watch Ad"}
        </button>
      </div>
      <div className="mt-3 text-xs text-white/70">
        Complete the ad to receive points. Closing early will not grant any reward.
      </div>
    </GlassCard>
  )
}
