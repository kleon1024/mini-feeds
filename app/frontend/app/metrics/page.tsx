import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { MetricsOverview } from "@/components/metrics-overview"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { DataTableCTR } from "./data-table-ctr"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">指标看板</h1>
                <p className="text-muted-foreground">Mini Feeds 核心业务指标监控</p>
              </div>
              
              <div className="px-4 lg:px-6">
                <MetricsOverview />
              </div>
              
              <div className="px-4 lg:px-6">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 relative z-10">
                    <TabsTrigger value="content">内容指标</TabsTrigger>
                    <TabsTrigger value="ads">广告指标</TabsTrigger>
                    <TabsTrigger value="commerce">商品指标</TabsTrigger>
                    <TabsTrigger value="users">用户指标</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-4">
                    <div className="mb-4">
                      <ChartAreaInteractive />
                    </div>
                    <DataTableCTR />
                  </TabsContent>
                  
                  <TabsContent value="ads" className="mt-4">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <h3 className="text-lg font-medium">广告收入趋势</h3>
                      <p className="text-sm text-muted-foreground mb-4">过去7天的广告收入、点击和曝光数据</p>
                      {/* 这里将来可以添加广告收入图表 */}
                      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                        广告收入图表（待实现）
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="commerce" className="mt-4">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <h3 className="text-lg font-medium">商品GMV趋势</h3>
                      <p className="text-sm text-muted-foreground mb-4">过去7天的商品GMV、转化率数据</p>
                      {/* 这里将来可以添加商品GMV图表 */}
                      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                        商品GMV图表（待实现）
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="users" className="mt-4">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <h3 className="text-lg font-medium">用户留存率</h3>
                      <p className="text-sm text-muted-foreground mb-4">用户次日/7日/30日留存率</p>
                      {/* 这里将来可以添加用户留存图表 */}
                      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                        用户留存图表（待实现）
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}