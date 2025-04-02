import { API_BASE_URL } from '$lib/config';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  try {
    console.log("Starting data load");
    
    // Fetch categories
    const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
    if (!categoriesResponse.ok) {
      console.error("Failed to fetch categories:", await categoriesResponse.text());
      throw new Error("Failed to fetch categories");
    }
    const categories = await categoriesResponse.json();
    console.log("Categories loaded:", categories);
    
    // Fetch all featured articles with related articles
    const featuredNews = [];
    
    try {
      const featuredResponse = await fetch(`${API_BASE_URL}/api/featured`);
      if (!featuredResponse.ok) {
        console.error("Failed to fetch featured articles:", await featuredResponse.text());
      } else {
        const featuredArticles = await featuredResponse.json();
        
        if (featuredArticles && featuredArticles.length > 0) {
          for (const featured of featuredArticles) {
            try {
              // Fetch related articles for each featured article
              const relatedResponse = await fetch(
                `${API_BASE_URL}/api/featured-with-related/${featured.category}`
              );
              
              if (!relatedResponse.ok) {
                throw new Error(`Failed to fetch related articles for ${featured.category}`);
              }
              
              const relatedData = await relatedResponse.json();
              
              featuredNews.push({
                keyInsights: (featured.keyInsights || "Key Insights Not Available")
                  .replace(/\\n/g, ' ')
                  .trim(),
                comprehensiveSummary: featured.comprehensiveSummary || "Summary Not Available",
                category: featured.category,
                serialNumbers: featured.serialNumbers || [],
                timestamp: featured.timestamp,
                relatedArticles: relatedData.relatedArticles.map(article => ({
                  ...article,
                  image: article.image ? 
                    article.image
                      .replace(/w=800&q=60/, 'w=1920&q=100')
                      .replace(/w=1200&q=80/, 'w=1920&q=100')
                      .replace(/w=1600&q=100/, 'w=1920&q=100') : 
                    '/placeholder.svg'
                }))
              });
            } catch (error) {
              console.error(`Error processing related articles for ${featured.category}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching featured articles:", error);
    }
    
    // Fetch top articles by category
    let newsByCategory = {};
    
    try {
      const topArticlesResponse = await fetch(`${API_BASE_URL}/api/top-articles`);
      if (!topArticlesResponse.ok) {
        console.error("Failed to fetch top articles:", await topArticlesResponse.text());
      } else {
        newsByCategory = await topArticlesResponse.json();
      }
    } catch (error) {
      console.error("Error fetching top articles:", error);
    }
    
    return {
      categories,
      featuredNews,
      newsByCategory
    };
  } catch (error) {
    console.error("Error in page load function:", error);
    return {
      categories: [],
      featuredNews: [],
      newsByCategory: {}
    };
  }
}

async function fetchArticleData() {
    if (!articleId) return;
    
    loading = true;
    error = null;
    
    try {
        // Fetch all featured articles first
        const response = await fetch(`${API_BASE_URL}/api/featured`);
        if (!response.ok) throw new Error('Failed to fetch featured articles');
        
        const featuredArticles = await response.json();
        
        // Find the featured article that contains the articleId in its serialNumbers
        const found = featuredArticles.find(article => 
            article.serialNumbers.includes(Number(articleId))
        );
        
        if (!found) {
            throw new Error('Featured article not found');
        }
        
        featuredArticle = found;
        
        // Now fetch all related articles by their serialNumbers
        const articlesPromises = featuredArticle.serialNumbers.map(serialNum => 
            fetch(`${API_BASE_URL}/api/article/${featuredArticle.category}/${serialNum}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch article with ID ${serialNum}`);
                    return res.json();
                })
        );
        
        relatedArticles = await Promise.all(articlesPromises);
        
    } catch (err) {
        console.error('Error fetching article data:', err);
        error = err.message || 'Failed to load article data';
    } finally {
        loading = false;
    }
} 