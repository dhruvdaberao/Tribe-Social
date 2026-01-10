import 'styled-components';

declare module 'styled-components' {
    export interface DefaultTheme {
        background: string;
        cardBackground: string;
        text: string;
        textSecondary: string;
        primary: string;
        secondary: string;
        border: string;
        hover: string;
        inputBackground: string;
        borderColor: string;
        hoverBackground: string;
        accentHover?: string; // Optional if not in light theme, but user put it in both.
        accentText?: string;
    }
}
