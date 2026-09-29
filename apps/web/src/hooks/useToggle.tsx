import React, { useCallback, useState } from 'react'

function useToggle(initialValue: boolean = false) {
    const [value, setValue] = useState<boolean>(initialValue);

    const toggle = useCallback(() => {
        setValue(v => !v);
    }, [])
    return [value, toggle] as const;
}

export default useToggle