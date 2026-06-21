"use client";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Dialog, DialogClose, DialogContent, DialogOverlay, DialogTrigger,} from "@/components/ui/dialog";
import {Search, X, XIcon} from "lucide-react";
import {Input} from "./ui/input";
import {usePathname, useRouter} from "next/navigation";

const SearchSheet = () => {
    const [open, setOpen] = React.useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("recentSearches");
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch {
                setRecentSearches([]);
            }
        }
    }, []);

    // Save to recent searches
    const saveToRecentSearches = useCallback(
        (search: string) => {
            if (!search.trim()) return;

            const updated = [
                search,
                ...recentSearches.filter(
                    (s) => s.toLowerCase() !== search.toLowerCase(),
                ),
            ].slice(0, 5); // Keep only 5 most recent

            setRecentSearches(updated);
            localStorage.setItem("recentSearches", JSON.stringify(updated));
        },
        [recentSearches],
    );

    // Handle search with debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                try {
                    // const result = await searchEscorts({ query: query.trim(), limit: 8 });
                    // if (result.success && result.data) {
                    //   setResults(result.data.suggestions || []);
                    // }

                    setResults([])
                } catch (error) {
                    console.error("Search error:", error);
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle search submission
    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        saveToRecentSearches(query.trim());
        setShowResults(false);

        // Navigate to search results page
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);

        // Clear input
        setQuery("");
        if (inputRef.current) inputRef.current.blur();
    };

    // Handle quick select from suggestions
    const handleQuickSelect = (result: any) => {
        saveToRecentSearches(result.name || result.username);

        if (result.type === "escort") {
            router.push(`/girl/${result.id}`);
        } else if (result.type === "location") {
            router.push(`/search?location=${encodeURIComponent(result.name)}`);
        }

        setShowResults(false);
        setQuery("");
    };

    // Clear search
    const handleClear = () => {
        setQuery("");
        setResults([]);
        if (inputRef.current) inputRef.current.focus();
    };

    // Remove recent search
    const removeRecentSearch = (index: number) => {
        const updated = recentSearches.filter((_, i) => i !== index);
        setRecentSearches(updated);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
    };
    return (
        <div className="z-50">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogOverlay className="bg-black/80"/>

                <DialogTrigger>
                    <Search className="h-8 w-8 text-white"/>
                </DialogTrigger>
                <DialogContent className="top-[20%]  lg:max-w-6xl">
                    <DialogClose asChild>
                        <button
                            className="absolute -top-12 right-4 p-2 rounded-sm overflow-hidden cursor-pointer z-20 bg-transparent text-primary">
                            <XIcon className="size-8"/>
                        </button>
                    </DialogClose>

                    <form onSubmit={handleSearch}>
                        <div className="flex gap-3 ">
                            <Input
                                ref={inputRef}
                                type="search"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowResults(true);
                                }}
                                aria-label="Search escorts"
                                onFocus={() => setShowResults(true)}
                                className="bg-white h-12 border-slate-300 focus-visible:border-slate-200 font-semibold text-black focus-visible:ring-0  rounded-md text-lg"
                            />
                            <button className="bg-primary uppercase  p-2 font-bold text-lg text-white rounded-md px-4">
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Recent Searches */}
                    {!isLoading && results.length === 0 && recentSearches.length > 0 && (
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-xs font-semibold text-black/60 uppercase tracking-wider">
                                    Recent Searches
                                </div>
                                <button
                                    onClick={() => {
                                        setRecentSearches([]);
                                        localStorage.removeItem("recentSearches");
                                    }}
                                    className="text-xs text-gray-500 hover:text-gray-300"
                                >
                                    Clear all
                                </button>
                            </div>

                            {recentSearches.map((search, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 hover:bg-white/5 rounded group"
                                >
                                    <button
                                        onClick={() => {
                                            setQuery(search);
                                            handleSearch();
                                        }}
                                        className="flex-1 text-left p-2 text-black"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Search className="h-4 w-4 text-gray-500"/>
                                            <span>{search}</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => removeRecentSearch(index)}
                                        className="p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100"
                                        aria-label="Remove search"
                                    >
                                        <X className="h-4 w-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SearchSheet;
