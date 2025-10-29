export interface KeyModel {
    id: string;
    key: string;
    userId: string;
    expiresAt: string | null;
    createdAt: string;
    isActive: boolean;
}