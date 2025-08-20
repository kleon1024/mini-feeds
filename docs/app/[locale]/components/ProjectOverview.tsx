import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Layers, Server, Database, Sparkles, Search, Brain } from "lucide-react";

type ProjectOverviewProps = {
  translations: {
    projectOverview: string;
    [key: string]: string;
  };
};

export default function ProjectOverview({ translations }: ProjectOverviewProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20">
              {translations.projectOverview}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">全栈信息流应用</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Mini Feeds 是一个完整的信息流应用，包含前端、后端、数据库、推荐系统等全栈组件
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group overflow-hidden border-2 transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="p-6">
              <div className="rounded-full bg-primary/10 p-2 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">前端架构</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground">
                基于 Next.js 和 shadcn/ui 构建的现代化前端，支持暗色模式和响应式设计
              </p>
            </CardContent>
          </Card>
          <Card className="group overflow-hidden border-2 transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="p-6">
              <div className="rounded-full bg-primary/10 p-2 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">后端服务</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground">
                FastAPI 异步后端，结合 SQLAlchemy 2.0 和 Pydantic v2，提供高性能 API
              </p>
            </CardContent>
          </Card>
          <Card className="group overflow-hidden border-2 transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="p-6">
              <div className="rounded-full bg-primary/10 p-2 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">数据存储</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground">
                PostgreSQL 作为主数据库，支持向量检索、全文搜索和 JSON 存储
              </p>
            </CardContent>
          </Card>
          <Card className="group overflow-hidden border-2 transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="p-6">
              <div className="rounded-full bg-primary/10 p-2 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">推荐引擎</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground">
                基于标签聚合、协同过滤和向量检索的多路召回，结合 LightGBM/XGBoost 精排模型
              </p>
            </CardContent>
          </Card>
          <Card className="group overflow-hidden border-2 transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="p-6">
              <div className="rounded-full bg-primary/10 p-2 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">搜索引擎</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground">
                基于 PostgreSQL 全文检索实现，支持 LLM 查询改写和语义搜索增强
              </p>
            </CardContent>
          </Card>
          <Card className="group overflow-hidden border-2 transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader className="p-6">
              <div className="rounded-full bg-primary/10 p-2 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">大模型应用</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-muted-foreground">
                集成 LLM 用于内容生成、推荐理由生成、查询理解与改写以及智能客服对话
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}