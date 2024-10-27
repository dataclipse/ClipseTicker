export const sort_items = (items, column, direction) => {
    return [...items].sort((a, b) => {
        const a_value = typeof a[column] === 'string' ? a[column].toLowerCase() : a[column];
        const b_value = typeof b[column] === 'string' ? b[column].toLowerCase() : b[column];

        if (direction === 'asc') {
            return a_value > b_value ? 1 : -1;
        } else {
            return a_value < b_value ? 1 : -1;
        }
    });
};