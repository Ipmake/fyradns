export default function getBackendURL() {
    return process.env.NODE_ENV === 'development'
        ? 'http://localhost:40222'
        : '';
}