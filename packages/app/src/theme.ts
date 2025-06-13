import { signal } from "@preact/signals";

export type Theme = 'dark' | 'light';

export const currentTheme = signal<Theme>()

export function loadTheme(): Theme {
    let theme = localStorage.getItem('theme') as Theme;
    const body = document.querySelector('body')!;

    if (theme === 'dark' || theme === 'light') {
        body.setAttribute('data-theme', theme);
        currentTheme.value = theme;
    } else {
        theme = body.getAttribute('data-theme')! as Theme;
    }
    currentTheme.value = theme;
    return theme;
}

export function setTheme(theme: Theme) {
    const body = document.querySelector('body')!;

    body.setAttribute('data-theme', theme);
    currentTheme.value = theme;
    localStorage.setItem('theme', theme);
}

export function toggleTheme() {
    if (currentTheme.value === 'dark') setTheme('light')
    else setTheme('dark');
}