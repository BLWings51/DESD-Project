import { useState, useEffect } from "react";
import { MultiSelect } from "@mantine/core";
import apiRequest from "../api/apiRequest";

interface TagDTO { id?: number; name: string }     // what your API MAY return

interface TagDropdownProps {
    value: (string | TagDTO)[];                      // parent can send strings OR objects
    onChange: (tags: string[]) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
}

const TagDropdown = ({
    value,
    onChange,
    label = "Tags",
    placeholder = "Select tags",
    required = false,
    error,
}: TagDropdownProps) => {
    /** Mantine wants { value, label }[] */
    const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    /* --------------------------------------------------------- */
    /* 1️⃣  Fetch and normalise TAG OPTIONS                      */
    /* --------------------------------------------------------- */
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await apiRequest<TagDTO[] | string[]>({
                    endpoint: `/tags/search/?q=${encodeURIComponent(searchQuery)}`,
                    method: "GET",
                });

                const newOptions =
                    res.data?.map((t) => {
                        const name = typeof t === "string" ? t : t.name;
                        return { value: name, label: name };
                    }) ?? [];

                setOptions(newOptions);
            } catch (err) {
                console.error("Error fetching tags:", err);
                setOptions([]);
            }
        };

        if (searchQuery.trim()) fetchTags();
        else setOptions([]);
    }, [searchQuery]);

    /* --------------------------------------------------------- */
    /* 2️⃣  Normalise the VALUE prop coming from the parent       */
    /*     (if parent already gives strings, this is a no-op)     */
    /* --------------------------------------------------------- */
    const normalisedValue = value.map((v) => (typeof v === "string" ? v : v.name));

    return (
        <MultiSelect
            label={label}
            placeholder={placeholder}
            data={options}                 // always { value, label }
            value={normalisedValue}        // always string[]
            onChange={onChange}            // parent receives string[]
            searchable
            clearable
            required={required}
            error={error}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            maxDropdownHeight={200}
            style={{ minWidth: 200 }}
        />
    );
};

export default TagDropdown;
