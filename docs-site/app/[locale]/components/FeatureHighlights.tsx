import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { CheckCircle, Server, Database, LineChart, Code } from "lucide-react";

type FeatureHighlightsProps = {
  categoryTranslations: {
    architecture: string;
    coreFeatures: string;
    recommendation: string;
    searchAds: string;
    commerceMarketing: string;
    llmApplications: string;
    advancedTopics: string;
    appendix: string;
    [key: string]: string;
  };
};

export default function FeatureHighlights({ categoryTranslations }: FeatureHighlightsProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20">
              特色功能
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">核心模块</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Mini Feeds 包含多个核心功能模块，每个模块都可以独立使用或组合使用
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2">
          <Card className="p-6 border-2 hover:shadow-md transition-all">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-primary/10 p-2 w-10 h-10 flex items-center justify-center">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{categoryTranslations.recommendation}</CardTitle>
              </div>
              <CardDescription className="text-base">
                基于用户行为和内容特征的个性化推荐，支持多种召回和排序算法
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <ul className="grid gap-2">
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>多路召回策略</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>机器学习排序模型</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>A/B测试框架</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="p-6 border-2 hover:shadow-md transition-all">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-primary/10 p-2 w-10 h-10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{categoryTranslations.searchAds}</CardTitle>
              </div>
              <CardDescription className="text-base">
                全文检索和精准广告投放，支持语义搜索和多种广告形式
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <ul className="grid gap-2">
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>全文检索</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>广告投放与定向</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>混排策略</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="p-6 border-2 hover:shadow-md transition-all">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-primary/10 p-2 w-10 h-10 flex items-center justify-center">
                  <LineChart className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{categoryTranslations.commerceMarketing}</CardTitle>
              </div>
              <CardDescription className="text-base">
                商品推荐和营销活动系统，支持购物车、结算和用户增长策略
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <ul className="grid gap-2">
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>商品推荐</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>营销活动系统</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>用户增长策略</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="p-6 border-2 hover:shadow-md transition-all">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-primary/10 p-2 w-10 h-10 flex items-center justify-center">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{categoryTranslations.llmApplications}</CardTitle>
              </div>
              <CardDescription className="text-base">
                LLM增强的内容生成与理解，支持推荐理由生成和查询理解
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <ul className="grid gap-2">
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>内容生成</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>推荐理由生成</span>
                </li>
                <li className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>智能客服对话</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}