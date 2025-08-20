"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchContentDistribution, fetchDailyActiveUsers, fetchUserInteractionRate } from "@/lib/api"

export function SectionCards() {
  const [dauData, setDauData] = useState(null)
  const [interactionData, setInteractionData] = useState(null)
  const [distributionData, setDistributionData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // 获取过去7天的日期范围
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        
        // 并行获取数据
        const [dau, interaction, distribution] = await Promise.all([
          fetchDailyActiveUsers(startDateStr, endDateStr),
          fetchUserInteractionRate(startDateStr, endDateStr),
          fetchContentDistribution()
        ])
        
        setDauData(dau)
        setInteractionData(interaction)
        setDistributionData(distribution)
      } catch (err) {
        console.error("Failed to fetch metrics data:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // 计算DAU增长率
  const calculateDauGrowth = () => {
    if (!dauData || dauData.length < 2) return { value: 0, isUp: true }
    
    const latest = dauData[dauData.length - 1].dau
    const previous = dauData[0].dau
    const growth = ((latest - previous) / previous) * 100
    
    return {
      value: Math.abs(growth).toFixed(1),
      isUp: growth >= 0
    }
  }
  
  // 计算互动率增长
  const calculateInteractionGrowth = () => {
    if (!interactionData || interactionData.length < 2) return { value: 0, isUp: true }
    
    const latest = interactionData[interactionData.length - 1].interaction_rate
    const previous = interactionData[0].interaction_rate
    const growth = ((latest - previous) / previous) * 100
    
    return {
      value: Math.abs(growth).toFixed(1),
      isUp: growth >= 0
    }
  }
  
  // 获取内容分布
  const getContentDistribution = (type) => {
    if (!distributionData) return { count: 0, percentage: 0 }
    
    const item = distributionData.find(item => item.kind === type)
    return item || { count: 0, percentage: 0 }
  }
  
  const dauGrowth = calculateDauGrowth()
  const interactionGrowth = calculateInteractionGrowth()
  const contentDist = getContentDistribution('content')
  const adDist = getContentDistribution('ad')

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>日活跃用户</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "加载中..." : error ? "--" : dauData && dauData.length > 0 ? dauData[dauData.length - 1].dau.toLocaleString() : "--"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {dauGrowth.isUp ? <IconTrendingUp /> : <IconTrendingDown />}
              {dauGrowth.isUp ? "+" : "-"}{dauGrowth.value}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {dauGrowth.isUp ? "用户增长趋势向好" : "用户增长需要关注"} 
            {dauGrowth.isUp ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            过去7天的用户活跃度
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>用户互动率</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "加载中..." : error ? "--" : interactionData && interactionData.length > 0 ? 
              (interactionData[interactionData.length - 1].interaction_rate * 100).toFixed(1) + "%" : "--"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {interactionGrowth.isUp ? <IconTrendingUp /> : <IconTrendingDown />}
              {interactionGrowth.isUp ? "+" : "-"}{interactionGrowth.value}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {interactionGrowth.isUp ? "互动表现良好" : "互动需要提升"} 
            {interactionGrowth.isUp ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            点赞/收藏等互动指标
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>内容分布</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "加载中..." : error ? "--" : contentDist ? 
              contentDist.count.toLocaleString() : "--"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {contentDist ? (contentDist.percentage * 100).toFixed(1) + "%" : "--"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            内容占比分析
          </div>
          <div className="text-muted-foreground">
            内容类型占总体的比例
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>广告分布</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "加载中..." : error ? "--" : adDist ? 
              adDist.count.toLocaleString() : "--"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {adDist ? (adDist.percentage * 100).toFixed(1) + "%" : "--"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            广告占比分析
          </div>
          <div className="text-muted-foreground">
            广告在总内容中的比例
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
