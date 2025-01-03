import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { SitemapProcessor } from './SitemapProcessor'
import { LineChart } from './charts/LineChart'
import { BarChart } from './charts/BarChart'
import { Button } from './ui/button'

interface ModelStats {
  modelName: string;
  runCount: number;
  changePercent: number;
}

interface AnalyticsData {
  newModels: number;
  totalRunCount: number;
  topModels: ModelStats[];
  trendingModels: ModelStats[];
  dailyStats: { date: string; count: number }[];
  weeklyStats: { date: string; count: number }[];
  monthlyStats: { date: string; count: number }[];
}

export function Dashboard() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?timeframe=${timeframe}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data: AnalyticsData = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const seedDemoData = async () => {
    try {
      const response = await fetch('/api/seed-demo-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to seed demo data')
      }

      const result = await response.json()
      console.log('Demo data seeded:', result)
      
      // Refresh the analytics after seeding
      await fetchAnalytics()
    } catch (error) {
      console.error('Error seeding demo data:', error)
    }
  }

  // ... rest of the code remains the same ...
}
