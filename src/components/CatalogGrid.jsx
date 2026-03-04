import React from 'react';
import ProductCard from './ProductCard';

const CatalogGrid = () => {
    // Premium Mock Data
    const products = [
        {
            id: "2",
            category: "מסכים ואינטראקטיב",
            title: "מסך מגע אינטראקטיבי Pro 75\"",
            price: "₪9,500",
            imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: "3",
            category: "שילוט קמפוס",
            title: "עמדת מידע קמפוס 86\"",
            price: "₪13,200",
            imageUrl: "https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: "4",
            category: "תוכנה ורישוי",
            title: "תוכנת EduEdit Studio",
            price: "₪150",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
        }
    ];

    return (
        <section className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-24 bg-brand-light">
            <div className="mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-4 text-center tracking-tight">
                    הכלים שמעצבים את המחר
                </h2>
                <p className="text-lg md:text-xl text-gray-500 text-center max-w-2xl mx-auto font-light leading-relaxed">
                    פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.
                </p>
            </div>

            {/* Grid System: Gestalt Proximity & Generous Whitespace */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        category={product.category}
                        title={product.title}
                        price={product.price}
                        imageUrl={product.imageUrl}
                    />
                ))}
            </div>
        </section>
    );
};

export default CatalogGrid;
