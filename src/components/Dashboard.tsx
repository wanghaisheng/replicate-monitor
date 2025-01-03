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

export function Dashboard(): JSX.Element {
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Replicate Model Analytics</h1>
        <div className="flex space-x-4">
          <SitemapProcessor />
          <Button 
            onClick={seedDemoData}
            variant="outline"
            className="whitespace-nowrap"
          >
            Load Demo Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>New Models</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : analytics?.newModels || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Runs</CardTitle>
            <CardDescription>Across all models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : analytics?.totalRunCount?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending Models</CardTitle>
            <CardDescription>Highest change in runs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : analytics?.trendingModels?.[0]?.modelName || 'None'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="models">Top Models</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setTimeframe('daily')}
                  variant={timeframe === 'daily' ? 'default' : 'outline'}
                >
                  Daily
                </Button>
                <Button
                  onClick={() => setTimeframe('weekly')}
                  variant={timeframe === 'weekly' ? 'default' : 'outline'}
                >
                  Weekly
                </Button>
                <Button
                  onClick={() => setTimeframe('monthly')}
                  variant={timeframe === 'monthly' ? 'default' : 'outline'}
                >
                  Monthly
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">Loading...</div>
              ) : (
                <LineChart
                  data={analytics?.[`${timeframe}Stats`] || []}
                  xField="date"
                  yField="count"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Used Models</CardTitle>
                <CardDescription>By total run count</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">Loading...</div>
                ) : (
                  <BarChart
                    data={analytics?.topModels || []}
                    xField="modelName"
                    yField="runCount"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Models</CardTitle>
                <CardDescription>By percentage increase in runs</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">Loading...</div>
                ) : (
                  <BarChart
                    data={analytics?.trendingModels || []}
                    xField="modelName"
                    yField="changePercent"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
