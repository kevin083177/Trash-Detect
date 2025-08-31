export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    placement: 'top' | 'bottom' | 'screen-top' | 'screen-center';
    targetElement?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    spotlight?: {
        padding?: number | {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        };
    };
    action?: () => void;
    requiresInput?: boolean;
}