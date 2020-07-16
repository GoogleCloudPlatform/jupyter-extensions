export const dateFormat = 'h:mm a, MMM. D, YYYY';

export function makeReadable(string: string): string {
    return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
};