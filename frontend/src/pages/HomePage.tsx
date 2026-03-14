import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturedDishes } from "@/components/featured-dishes"
import { FeaturesSection } from "@/components/features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { RecommendedDishes } from "@/components/recommended-dishes"
import { DealsCarousel } from "@/components/deals-carousel"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />

        {/* 🔥 Today's Deals Section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  🔥 Today's <span className="text-amber-600">Special Deals</span>
                </h2>
                <p className="mt-3 text-xl text-gray-500">
                  Grab these limited-time offers before they're gone!
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="flex space-x-2">
                  <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
                  <div className="w-4 h-1 bg-amber-200 rounded-full"></div>
                  <div className="w-4 h-1 bg-amber-200 rounded-full"></div>
                </div>
              </div>
            </div>
            <DealsCarousel />
          </div>
        </section>
        <RecommendedDishes />
        <FeaturedDishes />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
