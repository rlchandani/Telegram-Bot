export type Timestamp = { _seconds?: number; seconds?: number } | Date | string | number | null | undefined;

export function formatDate(timestamp: Timestamp): string {
    if (!timestamp) return 'N/A';

    let dateObj: Date | null = null;

    if (typeof timestamp === 'object' && '_seconds' in timestamp && typeof timestamp._seconds === 'number') {
        dateObj = new Date(timestamp._seconds * 1000);
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp && typeof timestamp.seconds === 'number') {
        dateObj = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
        dateObj = timestamp;
    } else if (typeof timestamp === 'string') {
        dateObj = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
        dateObj = new Date(timestamp);
    }

    if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
