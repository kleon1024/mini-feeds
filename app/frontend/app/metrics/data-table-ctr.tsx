"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ContentTypeCTR, fetchContentTypeCTR } from "@/lib/api"

type GroupedData = {
  [day: string]: {
    [kind: string]: {
      impressions: number;
      clicks: number;
      ctr: number;
    }
  }
}

type TableRowData = {
  day: string;
  content: { impressions: number; clicks: number; ctr: number };
  ad: { impressions: number; clicks: number; ctr: number };
  product: { impressions: number; clicks: number; ctr: number };
}

export function DataTableCTR() {
  const [data, setData] = useState<ContentTypeCTR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 获取过去7天的日期范围
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const ctrData = await fetchContentTypeCTR(startDateStr, endDateStr);
        setData(ctrData);
      } catch (err: any) {
        console.error("Failed to fetch CTR data:", err);
        setError(err.message || "获取数据失败");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // 按日期和类型分组数据
  const groupedData: GroupedData = data.reduce((acc: GroupedData, item) => {
    if (!acc[item.day]) {
      acc[item.day] = {};
    }
    acc[item.day][item.kind] = {
      impressions: item.impressions,
      clicks: item.clicks,
      ctr: item.ctr
    };
    return acc;
  }, {});

  // 转换为表格数据
  const tableData: TableRowData[] = Object.entries(groupedData).map(([day, kinds]) => ({
    day,
    content: kinds.content || { impressions: 0, clicks: 0, ctr: 0 },
    ad: kinds.ad || { impressions: 0, clicks: 0, ctr: 0 },
    product: kinds.product || { impressions: 0, clicks: 0, ctr: 0 }
  })).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>内容类型点击率</CardTitle>
        <CardDescription>过去7天各类型内容的点击率数据</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">加载失败: {error}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>内容类型</TableHead>
                  <TableHead>曝光量</TableHead>
                  <TableHead>点击量</TableHead>
                  <TableHead>点击率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.flatMap((row) => [
                  <TableRow key={`${row.day}-content`}>
                    <TableCell rowSpan={3}>{new Date(row.day).toLocaleDateString()}</TableCell>
                    <TableCell>内容</TableCell>
                    <TableCell>{row.content.impressions.toLocaleString()}</TableCell>
                    <TableCell>{row.content.clicks.toLocaleString()}</TableCell>
                    <TableCell>{(row.content.ctr * 100).toFixed(2)}%</TableCell>
                  </TableRow>,
                  <TableRow key={`${row.day}-ad`}>
                    <TableCell>广告</TableCell>
                    <TableCell>{row.ad.impressions.toLocaleString()}</TableCell>
                    <TableCell>{row.ad.clicks.toLocaleString()}</TableCell>
                    <TableCell>{(row.ad.ctr * 100).toFixed(2)}%</TableCell>
                  </TableRow>,
                  <TableRow key={`${row.day}-product`}>
                    <TableCell>商品</TableCell>
                    <TableCell>{row.product.impressions.toLocaleString()}</TableCell>
                    <TableCell>{row.product.clicks.toLocaleString()}</TableCell>
                    <TableCell>{(row.product.ctr * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                ])}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}