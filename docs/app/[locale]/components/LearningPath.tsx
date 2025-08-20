import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { BookOpen, Star, Users } from "lucide-react";

type LearningPathProps = {
  translations: {
    [key: string]: string;
  };
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

export default function LearningPath({ translations, categoryTranslations }: LearningPathProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20">
              学习路径
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">从入门到精通</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              按照以下路径学习，逐步掌握 Mini Feeds 的核心功能和高级特性
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
          <Card className="relative overflow-hidden border-2 transition-all hover:shadow-md group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 group-hover:bg-primary transition-colors"></div>
            <CardHeader className="pt-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                  1
                </div>
                <CardTitle className="text-xl">{categoryTranslations.architecture}</CardTitle>
              </div>
              <CardDescription className="text-base">
                了解项目架构、技术栈选择、数据模型设计和API契约设计
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BookOpen className="h-4 w-4" />
                <span>5 个章节</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>适合初学者</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href="/docs/1-architecture/system-overview" className="w-full">
                <Button variant="outline" className="w-full group-hover:border-primary/50 transition-colors">
                  {translations.startLearning}
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="relative overflow-hidden border-2 transition-all hover:shadow-md group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 group-hover:bg-primary transition-colors"></div>
            <CardHeader className="pt-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                  2
                </div>
                <CardTitle className="text-xl">{categoryTranslations.coreFeatures}</CardTitle>
              </div>
              <CardDescription className="text-base">
                学习Feed流实现、用户交互系统、内容管理和事件追踪
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BookOpen className="h-4 w-4" />
                <span>8 个章节</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                <span>中级难度</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href="/docs/2-core-features/index" className="w-full">
                <Button variant="outline" className="w-full group-hover:border-primary/50 transition-colors">
                  {translations.startLearning}
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="relative overflow-hidden border-2 transition-all hover:shadow-md group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 group-hover:bg-primary transition-colors"></div>
            <CardHeader className="pt-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                  3
                </div>
                <CardTitle className="text-xl">{categoryTranslations.advancedTopics}</CardTitle>
              </div>
              <CardDescription className="text-base">
                深入学习推荐系统、搜索与广告、商城与营销和大模型应用
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BookOpen className="h-4 w-4" />
                <span>12 个章节</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                <Star className="h-4 w-4" />
                <span>高级难度</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href="/docs/3-recommendation/index" className="w-full">
                <Button variant="outline" className="w-full group-hover:border-primary/50 transition-colors">
                  {translations.startLearning}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}