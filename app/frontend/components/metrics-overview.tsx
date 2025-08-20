"use client"

import { useEffect, useState } from "react"
import { MetricsCard } from "@/components/metrics-card"
import { fetchMetricsOverview } from "@/lib/api"

interface MetricsData {
  dau: {
    value: number
    growth: number
    trend: "up" | "down"
  }
  wau: {
    value: number
  }
  mau: {
    value: number
  }
  ad_revenue: {
    value: number
    growth: number
    trend: "up" | "down"
  }
  gmv: {
    value: number
    growth: number
    trend: "up" | "down"
  }
  overall_ctr: {
    value: number
  }
}

// 不再需要图表数据

export function MetricsOverview() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchMetricsOverview()
        setMetricsData(data)
      } catch (err: any) {
        console.error("Failed to fetch metrics overview:", err)
        setError(err.message || "获取指标概览失败")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="flex h-[200px] items-center justify-center">加载中...</div>
  }

  if (error) {
    return <div className="text-red-500">错误: {error}</div>
  }

  if (!metricsData) {
    return null
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <MetricsCard
        title="日活跃用户"
        description="日活跃用户 (DAU)"
        value={metricsData.dau.value.toLocaleString()}
        trend={metricsData.dau.trend}
        trendValue={`${metricsData.dau.growth > 0 ? "+" : ""}${metricsData.dau.growth.toFixed(1)}%`}
        footerText={metricsData.dau.trend === "up" ? "用户活跃度上升" : "用户活跃度下降"}
        footerSubText="过去7天的用户活跃情况"
      />
      <MetricsCard
        title="广告收入"
        description="广告收入"
        value={`¥${metricsData.ad_revenue.value.toLocaleString()}`}
        trend={metricsData.ad_revenue.trend}
        trendValue={`${metricsData.ad_revenue.growth > 0 ? "+" : ""}${metricsData.ad_revenue.growth.toFixed(1)}%`}
        footerText={metricsData.ad_revenue.trend === "up" ? "广告收入增长" : "广告收入下降"}
        footerSubText="过去7天的广告收入情况"
      />
      <MetricsCard
        title="商品GMV"
        description="商品GMV"
        value={`¥${metricsData.gmv.value.toLocaleString()}`}
        trend={metricsData.gmv.trend}
        trendValue={`${metricsData.gmv.growth > 0 ? "+" : ""}${metricsData.gmv.growth.toFixed(1)}%`}
        footerText={metricsData.gmv.trend === "up" ? "商品GMV增长" : "商品GMV下降"}
        footerSubText="过去7天的商品交易情况"
      />
      <MetricsCard
        title="活跃账户"
        description="月活跃用户数 (MAU)"
        value={metricsData.mau.value.toLocaleString()}
        footerText="稳定的用户留存"
        footerSubText="月度活跃用户数量"
      />
      <MetricsCard
        title="周活跃用户"
        description="周活跃用户 (WAU)"
        value={metricsData.wau.value.toLocaleString()}
        footerText="周活跃用户稳定"
        footerSubText="过去一周的活跃用户数量"
      />
      <MetricsCard
        title="整体点击率"
        description="整体点击率 (CTR)"
        value={`${(metricsData.overall_ctr.value * 100).toFixed(2)}%`}
        footerText="内容点击率表现良好"
        footerSubText="所有内容的平均点击率"
      />
    </div>
  )
}