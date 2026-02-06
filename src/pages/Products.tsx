import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/product.service';
import { Product, Category } from '../types';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories()
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError('Failed to load products. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
        <p className="text-gray-600 mb-8">Browse our collection of medical supplies</p>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Search Products</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Filter by Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No products found</h3>
            <p className="text-gray-600 mb-6">
              {products.length === 0 
                ? "No products in the database yet. Add products through your backend admin."
                : "Try adjusting your search or filter criteria"}
            </p>
            {products.length === 0 && (
              <div className="inline-block bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm">
                ⚠️ Backend connected but database is empty
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{filteredProducts.length}</span> of {products.length} products
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Product Image */}
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img 
                      src={product.imageUrl || 'https://via.placeholder.com/400x300?text=Medical+Product'}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Medical+Product';
                      }}
                    />
                    {!product.isActive && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Product Details */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-2xl font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </div>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                        product.stockQuantity > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.stockQuantity > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stockQuantity} in stock
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Link 
                        to={`/products/${product.id}`}
                        className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium text-center text-sm"
                      >
                        View Details
                      </Link>
                      
                      <button
                        disabled={!product.isActive}
                        className={`flex-1 px-4 py-2 rounded-lg transition font-medium text-sm ${
                          !product.isActive
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Database Status Info */}
        {products.length === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Next Steps:</h3>
            <div className="text-gray-600 space-y-2">
              <p>✅ <strong>Frontend is connected</strong> to your backend API</p>
              <p>✅ <strong>API endpoints are working</strong> (returns empty array)</p>
              <p>🔧 <strong>Backend database is empty</strong> - no products yet</p>
              <div className="mt-4">
                <p className="font-medium mb-2">To add products:</p>
                <ol className="text-sm space-y-1 ml-4 list-decimal">
                  <li>Use your backend admin panel</li>
                  <li>Or create a ProductsController with POST endpoint</li>
                  <li>Or seed the database with sample data</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;