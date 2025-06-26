import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Upload, User, Mail, Briefcase, Star, AlertCircle, Loader, X, Camera, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Header from '../components/Layout/Header';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: number;
  name: string;
  email: string;
  role: string;
  description: string;
  skills: string[];
  profile_picture?: string;
  team?: { name: string };
  similarity_score: number;
  highlighted_text?: string;
}

interface SemanticSearchPageProps {
  onBack: () => void;
  onProfileClick?: () => void;
}

const SemanticSearchPage: React.FC<SemanticSearchPageProps> = ({ onBack, onProfileClick }) => {
  const { user } = useAuth();
  const { members } = useApp();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Profile upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      // Call the semantic search edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/semantic-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input changes with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (.jpg, .jpeg, or .png)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Generate unique filename
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
      const filePath = `profiles/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      // Update user profile
      const { error: updateError } = await supabase
        .from('members')
        .update({ profile_picture: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Highlight matching terms in text
  const highlightText = (text: string, query: string) => {
    if (!query || query.length < 3) return text;
    
    const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header 
        title="Semantic Employee Search" 
        user={user} 
        onProfileClick={onProfileClick}
        onBack={onBack}
        showBackButton={true}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-lg mr-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Semantic Employee Search</h2>
              <p className="text-gray-600">Find employees using natural language and AI-powered semantic matching</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search employees by skills, experience, or role (e.g., 'React developer with backend experience')"
              className="w-full pl-10 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader className="h-5 w-5 text-purple-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Search Info */}
          <div className="text-sm text-gray-600 mb-4">
            <p>💡 Try searches like: "frontend developer", "Python machine learning", "project manager with agile experience"</p>
            <p>Minimum 3 characters required • Results sorted by relevance</p>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{searchError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Picture Upload Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg mr-4">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Update Profile Picture</h3>
              <p className="text-gray-600">Upload a new profile picture (JPG, PNG • Max 5MB)</p>
            </div>
          </div>

          {/* Upload Success Message */}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 text-sm">Profile picture updated successfully!</span>
              </div>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{uploadError}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* File Input */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors duration-200"
              />
            </div>

            {/* Preview and Actions */}
            {selectedFile && (
              <div className="flex items-center gap-3">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearFileSelection}
                    className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Search Results
                {searchResults.length > 0 && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({searchResults.length} {searchResults.length === 1 ? 'result' : 'results'})
                  </span>
                )}
              </h3>
              {searchQuery.length >= 3 && (
                <div className="text-sm text-gray-600">
                  Searching for: "<span className="font-medium">{searchQuery}</span>"
                </div>
              )}
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((result) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
                    {/* Profile Header */}
                    <div className="flex items-center mb-4">
                      {result.profile_picture ? (
                        <img
                          src={result.profile_picture}
                          alt={result.name}
                          className="w-12 h-12 rounded-full object-cover mr-3 ring-2 ring-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-3 ring-2 ring-gray-200">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {highlightText(result.name, searchQuery)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {highlightText(result.role, searchQuery)}
                        </p>
                      </div>
                      <div className="flex items-center bg-purple-100 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-purple-600 mr-1" />
                        <span className="text-xs font-medium text-purple-800">
                          {Math.round(result.similarity_score * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {result.email}
                      </div>
                      {result.team && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Briefcase className="h-4 w-4 mr-2" />
                          {result.team.name}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {result.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {highlightText(result.description, searchQuery)}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {result.skills && result.skills.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Skills</h5>
                        <div className="flex flex-wrap gap-1">
                          {result.skills.slice(0, 6).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {highlightText(skill, searchQuery)}
                            </span>
                          ))}
                          {result.skills.length > 6 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{result.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 3 && !isSearching ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No matches found</h4>
                <p className="text-gray-500 mb-4">
                  No employees match your search criteria. Try different keywords or broader terms.
                </p>
                <div className="text-sm text-gray-600">
                  <p>💡 Suggestions:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Use broader skill terms (e.g., "developer" instead of "React developer")</li>
                    <li>Try role-based searches (e.g., "manager", "designer", "analyst")</li>
                    <li>Search by department or team names</li>
                  </ul>
                </div>
              </div>
            ) : searchQuery.length > 0 && searchQuery.length < 3 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Search className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-gray-500">Type at least 3 characters to start searching</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Search className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-2">How Semantic Search Works</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• AI analyzes the meaning behind your search terms, not just keywords</li>
                <li>• Matches employees based on skills, experience, and role descriptions</li>
                <li>• Results are ranked by semantic similarity and relevance</li>
                <li>• Works with natural language queries like "experienced frontend developer"</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SemanticSearchPage;