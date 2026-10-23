const categories = ["All Products", "Electronics", "Fashion", "Home & Living", "Accessories"];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="category-list" aria-label="Filter by category">
      {categories.map((category) => (
        <button
          key={category}
          className={`category-chip${selected === category ? " active" : ""}`}
          type="button"
          aria-pressed={selected === category}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
