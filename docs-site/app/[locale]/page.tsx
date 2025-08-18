import { getDocsByCategory } from "../../lib/mdx"
import { getTranslations } from 'next-intl/server';

// 导入组件
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import ProjectOverview from "./components/ProjectOverview";
import FeatureHighlights from "./components/FeatureHighlights";
import LearningPath from "./components/LearningPath";
import ContentDirectory from "./components/ContentDirectory";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default async function Home({ params }: { params: { locale: string } }) {
  // 获取所有文档并按类别分组
  const categories = await getDocsByCategory()
  const t = await getTranslations({locale: params.locale, namespace: 'Index'});
  const tNav = await getTranslations({locale: params.locale, namespace: 'Navigation'});
  const tCat = await getTranslations({locale: params.locale, namespace: 'Categories'});

  // 预先获取所有需要的翻译内容
  const translations = {
    index: {
      docs: t('docs'),
      faq: t('faq'),
      subtitle: t('subtitle'),
      title: t('title'),
      description: t('description'),
      startLearning: t('startLearning'),
      projectOverview: t('projectOverview'),
      // 添加其他需要的翻译
    },
    nav: {
      browseDocs: tNav('browseDocs'),
      // 添加其他导航翻译
    },
  }

  // 预先获取所有类别翻译
  const categoryTranslations = {
    architecture: tCat('architecture'),
    coreFeatures: tCat('coreFeatures'),
    recommendation: tCat('recommendation'),
    searchAds: tCat('searchAds'),
    commerceMarketing: tCat('commerceMarketing'),
    llmApplications: tCat('llmApplications'),
    advancedTopics: tCat('advancedTopics'),
    appendix: tCat('appendix'),
  }

  // 类别顺序映射
  const categoryOrder: Record<string, number> = {
    [categoryTranslations.architecture]: 1,
    [categoryTranslations.coreFeatures]: 2,
    [categoryTranslations.recommendation]: 3,
    [categoryTranslations.searchAds]: 4,
    [categoryTranslations.commerceMarketing]: 5,
    [categoryTranslations.llmApplications]: 6,
    [categoryTranslations.advancedTopics]: 7,
    [categoryTranslations.appendix]: 8,
  }

  // 按顺序排序类别
  const sortedCategories = Object.keys(categories).sort(
    (a, b) => (categoryOrder[a] || 99) - (categoryOrder[b] || 99)
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header translations={translations.index} navTranslations={translations.nav} />

      <main className="flex-1">
        <HeroSection translations={translations.index} categoryTranslations={categoryTranslations} />

        <ProjectOverview translations={translations.index} />

        <FeatureHighlights categoryTranslations={categoryTranslations} />

        <LearningPath translations={translations.index} categoryTranslations={categoryTranslations} />

        <ContentDirectory translations={translations.index} categories={categories} sortedCategories={sortedCategories} />

        <CTASection translations={translations.index} />
      </main>

      <Footer translations={translations.index} />
    </div>
  )
}