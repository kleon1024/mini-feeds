"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useState, useEffect } from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { fetchContentTypeCTR, fetchDailyActiveUsers, ContentTypeCTR } from "@/lib/api"

export const description = "An interactive area chart"

// 备用数据，当API请求失败时使用
const fallbackData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
]

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  // 定义chartData的类型
  type ChartDataItem = {
    date: string;
    value: number;
  };
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // 移除chartType和contentType状态，默认只展示DAU
  const chartType = "dau"
  const [timeRange, setTimeRange] = useState("7d") // 默认显示7天数据
  
  // 图表配置
  const chartConfig: ChartConfig = {
    x: {
      label: "date"
    },
    y: {
      label: "value"
    },
    series: {
      label: "value",
      color: "var(--color-primary)"
    },
    valueFormatter: (value: number) => value.toString(),
    labelFormatter: (value: string) => {
      const date = new Date(value)
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      })
    }
  }
  
  // 获取日期范围（根据选择的时间范围）
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    
    // 根据选择的时间范围设置起始日期
    switch (timeRange) {
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "7d":
      default:
        startDate.setDate(startDate.getDate() - 7)
        break
    }
    
    // 确保日期格式正确，使用YYYY-MM-DD格式
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    }
  }
  
  // 格式化数据为图表所需格式
  const formatDauData = (data: any[]) => {
    return data.map(item => ({
      date: item.day,
      value: item.dau
    }))
  }
  
  // 移除formatCtrData函数，因为我们不再需要它
  
  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { startDate, endDate } = getDateRange()
        
        // 只获取DAU数据
        const data = await fetchDailyActiveUsers(startDate, endDate)
        setChartData(formatDauData(data))
      } catch (err: any) {
        console.error("Failed to fetch chart data:", err)
        setError(err.message)
        // 使用备用数据，只显示DAU
        setChartData(fallbackData.map(item => ({
          date: item.date,
          value: item.desktop
        })))
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [timeRange]) // 移除chartType和contentType依赖项

  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>数据趋势</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              日活跃用户趋势图
            </span>
            <span className="@[540px]/card:hidden">
              DAU趋势
            </span>
          </CardDescription>
        </div>
        <CardAction>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div>
              <ToggleGroup
                type="single"
                value={timeRange}
                onValueChange={setTimeRange}
                variant="outline"
                className="hidden md:flex *:data-[slot=toggle-group-item]:px-4"
              >
                <ToggleGroupItem value="90d">90天</ToggleGroupItem>
                <ToggleGroupItem value="30d">30天</ToggleGroupItem>
                <ToggleGroupItem value="7d">7天</ToggleGroupItem>
              </ToggleGroup>
              <div className="md:hidden">
                <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger
                  className="w-[100px]"
                  size="sm"
                  aria-label="选择时间范围"
                >
                  <SelectValue placeholder="时间范围" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="90d" className="rounded-lg">
                    90天
                  </SelectItem>
                  <SelectItem value="30d" className="rounded-lg">
                    30天
                  </SelectItem>
                  <SelectItem value="7d" className="rounded-lg">
                    7天
                  </SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-sm text-muted-foreground">加载失败: {error}</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart
              data={chartData}
              margin={{
                top: 8,
                right: 8,
                left: 8,
                bottom: 8,
              }}
            >
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                strokeOpacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="value"
                type="monotone"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradient)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
