import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Server, Users, Shield } from 'lucide-react';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface SearchResult {
  id: string;
  type: 'vm' | 'customer' | 'gp_account';
  title: string;
  subtitle: string;
  metadata: string;
}

interface UniversalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalSearch: React.FC<UniversalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      
      // Mock search results - will be replaced with Supabase once connected
      const searchResults: SearchResult[] = [
        {
          id: '1',
          type: 'vm',
          title: 'Web-Server-01',
          subtitle: 'IT Department',
          metadata: 'Active • 203.0.113.10'
        },
        {
          id: '2',
          type: 'customer',
          title: 'IT Department',
          subtitle: 'Customer',
          metadata: 'Created 1/10/2024'
        },
        {
          id: '3',
          type: 'gp_account',
          title: 'user001',
          subtitle: 'IT Department',
          metadata: '10.0.2.100'
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.metadata.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'vm': return <Server className="w-4 h-4 text-blue-600" />;
      case 'customer': return <Users className="w-4 h-4 text-green-600" />;
      case 'gp_account': return <Shield className="w-4 h-4 text-purple-600" />;
      default: return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex min-h-screen items-start justify-center p-4 pt-16">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search VMs, customers, GP accounts..."
                    className="pl-10 pr-10 text-lg"
                    autoFocus
                  />
                  <button
                    onClick={onClose}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}

                {!loading && results.length === 0 && query.trim() && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No results found for "{query}"</p>
                  </div>
                )}

                {!loading && results.length === 0 && !query.trim() && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Start typing to search across all resources</p>
                  </div>
                )}

                <div className="p-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        // Handle result selection
                        onClose();
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {getIcon(result.type)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{result.title}</p>
                          <p className="text-sm text-gray-600">{result.subtitle}</p>
                          <p className="text-xs text-gray-500">{result.metadata}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};