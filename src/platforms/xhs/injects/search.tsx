import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const SearchNotes = () => {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async () => {
        if (!keyword.trim()) {
            toast.error("请输入关键词");
            return;
        }

        try {
            const response = await browser.runtime.sendMessage<"executeScript">({
                name: "executeScript",
                body: `return window["_webmsxyw"]("${keyword}")`,
            });
            setResults(response.data);
            toast.success("搜索成功");
        } catch (error) {
            console.error(error);
            toast.error("搜索失败");
        }
    };

    // @ts-ignore
    return (
        <div className="search-container">
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="输入关键词"
                className="input-field"
            />
            <Button onClick={handleSearch}>搜索</Button>
            <div>
                {results.map((result, index) => (
                    <div key={index}>
                        <h3>{result.title}</h3>
                        <p>{result.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchNotes;
