"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface MetricsCardProps {
  title: string
  value: string | number
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string | number
  trendText?: string
  footerText?: string
  footerSubText?: string
}

export function MetricsCard({
  title,
  value,
  description,
  trend = "neutral",
  trendValue,
  trendText,
  footerText,
  footerSubText,
}: MetricsCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{description || title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {trend !== "neutral" && trendValue && (
          <CardAction>
            <Badge variant="outline">
              {trend === "up" ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
              {trendValue}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {(footerText || footerSubText) && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footerText && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footerText} {trend === "up" ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
            </div>
          )}
          {footerSubText && (
            <div className="text-muted-foreground">
              {footerSubText}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}