import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Zap } from "lucide-react";

type CTASectionProps = {
  translations: {
    startLearning: string;
    [key: string]: string;
  };
};

export default function CTASection({ translations }: CTASectionProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-muted/50 to-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-3 max-w-[800px]">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              准备好开始了吗？
            </h2>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              立即开始学习 Mini Feeds，构建你自己的信息流应用
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
            <Link href="/docs/1-architecture/overview">
              <Button size="lg" className="gap-1.5 group px-8 shadow-sm">
                {translations.startLearning}
                <Zap className="h-4 w-4 transition-transform group-hover:scale-125" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}