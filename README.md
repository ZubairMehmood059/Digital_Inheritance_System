# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# 🌗 Theme System Update!

## New Feature Added: Dark / Light Theme Toggle

The project now supports a fully interactive Dark and Light theme system for better user experience and accessibility.

### ✨ Features

* Dynamic theme switching
* Persistent theme using localStorage
* Global theme support across all pages
* Responsive UI in both themes
* Smooth visual consistency throughout the application

### 🛠 Theme Implementation

The selected theme is stored in:

```js
localStorage.setItem("fh_theme", "dark")
```

The application applies theme using:

```html
data-theme="dark"
```

or

```html
data-theme="light"
```

on the root HTML element.

### 📌 Supported Pages

* Dashboard
* Vault
* Trusted Contacts
* Documents
* Udhaar Manager
* Subscription Tracker
* Bill Manager
* Time Capsule
* Emergency Card
* AI Life Summary
* Legacy Trigger

### 🎨 UI Improvements

* Unified color variables
* Improved card consistency
* Better readability in dark mode
* Reduced hardcoded colors
* Modern responsive appearance

### 🚀 User Experience

Users can now switch themes instantly without page reload, and their preference remains saved automatically for future sessions.
