export type ApiCommonUser = {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
    name: {
        first: string;
        last: string;
        middle?: string | undefined;
    };
    status: "active" | "inactive" | "suspended";
    lastLoginAt: string | null;
    profile: {
        avatar: string | null;
        title: string | null;
        department: string | null;
    };
    preferences: {
        language: string;
        timezone: string;
        emailNotifications: boolean;
    };
}

export const testString = "Shared compoenet work!"