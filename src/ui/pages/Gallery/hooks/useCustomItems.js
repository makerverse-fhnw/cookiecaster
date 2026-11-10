import { useCallback, useEffect, useState } from "react";

export function useCustomItems(storageKey = "drawings") {
    const [customItems, setCustomItems] = useState([]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(storageKey)) || [];
        setCustomItems(stored.filter((d) => d.saved));
    }, [storageKey]);

    const deleteItem = useCallback(
        (id) => {
            setCustomItems((prev) => {
                const rest = prev.filter((i) => i.id !== id);
                localStorage.setItem(storageKey, JSON.stringify(rest));
                return rest;
            });
        },
        [storageKey]
    );

    return { customItems, deleteItem };
}