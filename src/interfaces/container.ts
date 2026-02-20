export interface CreateContainerData {
    app_id: string;
    variant_id: string;
    version_id: string;
    free: boolean;
    name: string;
    region_id: string;
    runtime: string;
    segments: number;
    user_id: string;
}