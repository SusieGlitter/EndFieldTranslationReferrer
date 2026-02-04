const { useState, useEffect, useMemo, useCallback } = React;
const { Search, Info, AlertCircle, Check, Loader2, ChevronDown, ChevronUp, Copy } = lucideReact;

// --- Constants ---
// Use relative path for GitHub Pages
const REPO_RAW_BASE_URL = './data'; 
const LANG_NAME_ID = "-4343576784152848542";
const SUPPORTED_LANGUAGES = ['CN', 'TC', 'EN', 'JP', 'KR'];
const DEFAULT_SOURCE_LANG = 'CN';
const DEFAULT_TARGET_LANGS = ['TC', 'EN', 'JP', 'KR'];
const SEARCH_RESULT_LIMIT = 50;

// --- Services ---
const fetchLanguageData = async (langCode) => {
  if (!SUPPORTED_LANGUAGES.includes(langCode)) {
    throw new Error(`Unsupported language code: ${langCode}`);
  }

  const url = `${REPO_RAW_BASE_URL}/I18nTextTable_${langCode}.json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch language data for ${langCode}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${langCode}:`, error);
    throw error;
  }
};

// --- Components ---

const LanguageControls = ({
  sourceLang,
  targetLangs,
  setSourceLang,
  setTargetLangs,
  languageMap,
  loadingStatus,
}) => {
  const getLangName = (code) => {
    const dict = languageMap[code];
    if (dict && dict[LANG_NAME_ID]) {
      return dict[LANG_NAME_ID];
    }
    return code;
  };

  const handleSourceChange = (e) => {
    const newSource = e.target.value;
    setSourceLang(newSource);
    if (targetLangs.includes(newSource)) {
      setTargetLangs(targetLangs.filter(l => l !== newSource));
    }
  };

  const handleTargetToggle = (lang) => {
    if (lang === sourceLang) return;
    if (targetLangs.includes(lang)) {
      setTargetLangs(targetLangs.filter(l => l !== lang));
    } else {
      setTargetLangs([...targetLangs, lang]);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md flex flex-col gap-4">
      {/* Source Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label htmlFor="source-select" className="text-sm font-medium text-gray-400 min-w-[100px]">
          Source Language:
        </label>
        <div className="relative">
          <select
            id="source-select"
            value={sourceLang}
            onChange={handleSourceChange}
            className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 pr-8 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none min-w-[150px]"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {getLangName(lang)} ({lang})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        {loadingStatus[sourceLang] === 'loading' && (
           <Loader2 className="w-4 h-4 text-amber-500 animate-spin ml-2" />
        )}
      </div>

      {/* Target Language Checkboxes */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-400">Target Languages:</span>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSource = lang === sourceLang;
            const isSelected = targetLangs.includes(lang);
            const isLoading = loadingStatus[lang] === 'loading';

            return (
              <button
                key={lang}
                onClick={() => handleTargetToggle(lang)}
                disabled={isSource}
                className={`
                  relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors
                  ${isSource 
                    ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed opacity-50' 
                    : isSelected
                      ? 'bg-amber-900/30 border-amber-600 text-amber-200 hover:bg-amber-900/50'
                      : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-gray-500'
                  }
                `}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  isSelected && !isSource && <Check className="w-3 h-3" />
                )}
                <span>{getLangName(lang)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SearchResultItem = ({
  item,
  sourceLang,
  targetLangs,
  languageMap,
  query,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const renderHighlightedText = (text, highlight) => {
    if (!highlight || !highlight.trim()) return text;
    // Simple split for highlighting, case insensitive
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-amber-500/30 text-amber-200 font-semibold px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getLangName = (code) => {
    const dict = languageMap[code];
    return dict && dict[LANG_NAME_ID] ? dict[LANG_NAME_ID] : code;
  };

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="border-b border-gray-800 last:border-0">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          p-4 cursor-pointer hover:bg-gray-800/50 transition-colors
          ${isExpanded ? 'bg-gray-800/30' : ''}
        `}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-1">
             <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
               <span>ID: {item.id}</span>
               <button 
                 onClick={handleCopyId}
                 className="hover:text-amber-400 transition-colors"
                 title="Copy ID"
               >
                 {copiedId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
               </button>
             </div>
             <p className="text-gray-200 text-sm leading-relaxed">
               {renderHighlightedText(item.text, query)}
             </p>
          </div>
          <div className="text-gray-500 mt-1">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-900/50 p-4 border-t border-gray-800 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          {targetLangs.map(lang => {
             const text = languageMap[lang]?.[item.id];
             return (
               <div key={lang} className="grid grid-cols-[80px_1fr] gap-4 text-sm">
                 <div className="text-right text-gray-500 font-medium py-0.5">
                   {getLangName(lang)}
                 </div>
                 <div className="text-gray-300 py-0.5 select-text">
                   {text || <span className="text-gray-600 italic">No translation found</span>}
                 </div>
               </div>
             );
          })}
          <div className="grid grid-cols-[80px_1fr] gap-4 text-sm opacity-60">
             <div className="text-right text-gray-500 font-medium py-0.5">
               {getLangName(sourceLang)}
             </div>
             <div className="text-gray-300 py-0.5">
               {item.text}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

function App() {
  const [sourceLang, setSourceLang] = useState(DEFAULT_SOURCE_LANG);
  const [targetLangs, setTargetLangs] = useState(DEFAULT_TARGET_LANGS);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [languageMap, setLanguageMap] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(
    SUPPORTED_LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: 'idle' }), {})
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadLanguage = useCallback(async (lang) => {
    if (loadingStatus[lang] !== 'idle') return;

    setLoadingStatus(prev => ({ ...prev, [lang]: 'loading' }));
    
    try {
      const data = await fetchLanguageData(lang);
      setLanguageMap(prev => ({ ...prev, [lang]: data }));
      setLoadingStatus(prev => ({ ...prev, [lang]: 'success' }));
    } catch (error) {
      console.error(error);
      setLoadingStatus(prev => ({ ...prev, [lang]: 'error' }));
    }
  }, [loadingStatus]);

  useEffect(() => {
    const langsToLoad = [sourceLang, ...targetLangs];
    langsToLoad.forEach(lang => {
      if (!languageMap[lang] && loadingStatus[lang] === 'idle') {
        loadLanguage(lang);
      }
    });
  }, [sourceLang, targetLangs, languageMap, loadingStatus, loadLanguage]);

  useEffect(() => {
    SUPPORTED_LANGUAGES.forEach(lang => {
       if (loadingStatus[lang] === 'idle') {
         loadLanguage(lang);
       }
    });
  }, []); 

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const sourceData = languageMap[sourceLang];
    if (!sourceData) return [];

    const queryLower = debouncedQuery.toLowerCase();
    const results = [];

    for (const [id, text] of Object.entries(sourceData)) {
      if (typeof text === 'string' && text.toLowerCase().includes(queryLower)) {
        results.push({ id, text });
      }
      if (results.length > 2000) break; 
    }

    results.sort((a, b) => a.text.length - b.text.length);

    return results.slice(0, SEARCH_RESULT_LIMIT);
  }, [debouncedQuery, sourceLang, languageMap]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl space-y-6">
        
        <div className="flex flex-col gap-2 border-b border-gray-800 pb-6">
           <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
             Endfield Translation Referrer
           </h1>
           <p className="text-gray-400 text-sm">
             Search localization data by source text and cross-reference multiple languages.
           </p>
        </div>

        <LanguageControls
          sourceLang={sourceLang}
          targetLangs={targetLangs}
          setSourceLang={setSourceLang}
          setTargetLangs={setTargetLangs}
          languageMap={languageMap}
          loadingStatus={loadingStatus}
        />

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-amber-500 transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg leading-5 bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-100 transition-all shadow-sm"
            placeholder="Type source text to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loadingStatus[sourceLang] === 'loading' && (
          <div className="flex items-center justify-center py-8 text-amber-500 gap-2">
             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
             <span>Loading source dictionary...</span>
          </div>
        )}

        {loadingStatus[sourceLang] === 'error' && (
           <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded border border-red-900/50">
             <AlertCircle className="w-5 h-5" />
             <span>Error loading source language data. Please check your network or try again later.</span>
           </div>
        )}

        <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-xl overflow-hidden min-h-[200px]">
          {searchResults.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {searchResults.map((item) => (
                <SearchResultItem
                  key={item.id}
                  item={item}
                  sourceLang={sourceLang}
                  targetLangs={targetLangs}
                  languageMap={languageMap}
                  query={debouncedQuery}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-gray-500 space-y-2">
              {debouncedQuery ? (
                <>
                  <Info className="w-8 h-8 opacity-50" />
                  <p>No matches found in {sourceLang}</p>
                </>
              ) : (
                <>
                  <Search className="w-8 h-8 opacity-50" />
                  <p>Enter text to begin searching</p>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="text-center text-gray-600 text-xs py-4">
           Data sourced from <a href="https://github.com/SusieGlitter/EndFieldTranslationReferrer" target="_blank" rel="noreferrer" className="text-amber-700 hover:text-amber-500 underline">SusieGlitter/EndFieldTranslationReferrer</a>.
        </div>
      </div>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);