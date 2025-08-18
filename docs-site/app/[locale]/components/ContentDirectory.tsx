import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";

type ContentDirectoryProps = {
  translations: {
    contentDirectory: string;
    comprehensiveTutorial: string;
    [key: string]: string;
  };
  categories: Record<string, any[]>;
  sortedCategories: string[];
};

export default function ContentDirectory({ translations, categories, sortedCategories }: ContentDirectoryProps) {
  return (
    <section className="container py-12 md:py-16 lg:py-20">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-10">
        <Badge variant="outline" className="px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20">
          {translations.contentDirectory}
        </Badge>
        <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-4xl">
          {translations.comprehensiveTutorial}
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          {translations.developmentProcess}
        </p>
      </div>
      
      <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 lg:grid-cols-3">
        {sortedCategories.map((category) => (
          <Card key={category} className="flex flex-col justify-between overflow-hidden border-2 transition-all hover:shadow-md hover:border-primary/20 group">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl group-hover:text-primary transition-colors">{category}</CardTitle>
              <CardDescription>
                {categories[category].length}篇文档
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <ul className="list-disc pl-5 space-y-2">
                {categories[category].slice(0, 3).map((doc) => (
                  <li key={doc.slug}>
                    <Link href={doc.slug} className="hover:underline text-primary hover:text-primary/80 transition-colors">
                      {doc.title}
                    </Link>
                  </li>
                ))}
                {categories[category].length > 3 && (
                  <li className="text-muted-foreground">...</li>
                )}
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href={`/docs#${category}`} className="w-full">
                <Button variant="outline" className="w-full group-hover:border-primary/50 transition-colors">
                  {translations.browseAll}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}