import { ArrowRight, SearchX, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryFilter from "../components/CategoryFilter";
import ProductCard from "../components/ProductCard";
import { fetchProducts, products } from "../data/products";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [productList, setProductList] = useState(products);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const search = (searchParams.get("q") || "").trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchProducts();
        if (!cancelled) {
          setProductList(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Unable to load products.");
          setProductList([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(
    () => productList.filter((product) => {
      const categoryMatches =
        selectedCategory === "All Products" || product.category === selectedCategory;
      const searchMatches =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);
      return categoryMatches && searchMatches;
    }),
    [productList, selectedCategory, search],
  );

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> MADE FOR EVERYDAY</span>
          <h1>Find your next <span>favorite.</span></h1>
          <p>Explore quality products at great prices. The little upgrades that make every day better.</p>
          <a className="button button-primary hero-button" href="#products">
            Shop now <ArrowRight size={17} aria-hidden="true" />
          </a>
          <div className="hero-perks">
            <span><Truck size={17} aria-hidden="true" /> Easy delivery</span>
            <span><ShieldCheck size={17} aria-hidden="true" /> Quality you can trust</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Curated shopping essentials">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-note"><span className="hero-note-icon">✳</span><span>Good finds.<br /><strong>Better days.</strong></span></div>
          <div className="hero-card hero-card-top"><span className="hero-card-symbol">◌</span><span>Everyday<br />essentials</span></div>
          <div className="hero-card hero-card-bottom"><span className="hero-card-symbol">↗</span><span>Picked for<br />your routine</span></div>
          <div className="hero-center"><span>EST.</span><strong>E</strong><small>EASTMAN STORE</small></div>
        </div>
      </section>

      <section className="benefits-strip" aria-label="Shopping benefits">
        <span>Curated essentials</span><i />
        <span>Great value, every day</span><i />
        <span>Easy, secure shopping</span>
      </section>

      <section className="catalog-section content-width" id="products">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE EASTMAN EDIT</span>
            <h2>Something for every day</h2>
            <p>Useful, well-loved picks for your home, commute, and beyond.</p>
          </div>
          <span className="result-count">{filteredProducts.length} products</span>
        </div>
        <div className="catalog-toolbar" id="categories">
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        {isLoading ? (
          <div className="empty-results">
            <h3>Loading products...</h3>
            <p>Fetching the latest Eastman catalog.</p>
          </div>
        ) : error ? (
          <div className="empty-results">
            <SearchX size={34} strokeWidth={1.5} aria-hidden="true" />
            <h3>Unable to load products</h3>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="empty-results">
            <SearchX size={34} strokeWidth={1.5} aria-hidden="true" />
            <h3>No products found</h3>
            <p>Try a different search or choose another category.</p>
            <button className="button button-outline" type="button" onClick={() => setSelectedCategory("All Products")}>
              Show all products
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
